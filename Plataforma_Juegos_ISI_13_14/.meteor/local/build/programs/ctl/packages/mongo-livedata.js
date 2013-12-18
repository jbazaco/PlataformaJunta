(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var _ = Package.underscore._;
var LocalCollection = Package.minimongo.LocalCollection;
var Log = Package.logging.Log;
var DDP = Package.livedata.DDP;
var DDPServer = Package.livedata.DDPServer;
var Deps = Package.deps.Deps;
var AppConfig = Package['application-configuration'].AppConfig;
var check = Package.check.check;
var Match = Package.check.Match;

/* Package-scope variables */
var MongoInternals, MongoConnection, LocalCollectionDriver;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/mongo-livedata/mongo_driver.js                                                             //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
/**                                                                                                    // 1
 * Provide a synchronous Collection API using fibers, backed by                                        // 2
 * MongoDB.  This is only for use on the server, and mostly identical                                  // 3
 * to the client API.                                                                                  // 4
 *                                                                                                     // 5
 * NOTE: the public API methods must be run within a fiber. If you call                                // 6
 * these outside of a fiber they will explode!                                                         // 7
 */                                                                                                    // 8
                                                                                                       // 9
var path = Npm.require('path');                                                                        // 10
var MongoDB = Npm.require('mongodb');                                                                  // 11
var Fiber = Npm.require('fibers');                                                                     // 12
var Future = Npm.require(path.join('fibers', 'future'));                                               // 13
                                                                                                       // 14
MongoInternals = {};                                                                                   // 15
                                                                                                       // 16
var replaceNames = function (filter, thing) {                                                          // 17
  if (typeof thing === "object") {                                                                     // 18
    if (_.isArray(thing)) {                                                                            // 19
      return _.map(thing, _.bind(replaceNames, null, filter));                                         // 20
    }                                                                                                  // 21
    var ret = {};                                                                                      // 22
    _.each(thing, function (value, key) {                                                              // 23
      ret[filter(key)] = replaceNames(filter, value);                                                  // 24
    });                                                                                                // 25
    return ret;                                                                                        // 26
  }                                                                                                    // 27
  return thing;                                                                                        // 28
};                                                                                                     // 29
                                                                                                       // 30
var makeMongoLegal = function (name) { return "EJSON" + name; };                                       // 31
var unmakeMongoLegal = function (name) { return name.substr(5); };                                     // 32
                                                                                                       // 33
var replaceMongoAtomWithMeteor = function (document) {                                                 // 34
  if (document instanceof MongoDB.Binary) {                                                            // 35
    var buffer = document.value(true);                                                                 // 36
    return new Uint8Array(buffer);                                                                     // 37
  }                                                                                                    // 38
  if (document instanceof MongoDB.ObjectID) {                                                          // 39
    return new Meteor.Collection.ObjectID(document.toHexString());                                     // 40
  }                                                                                                    // 41
  if (document["EJSON$type"] && document["EJSON$value"]) {                                             // 42
    return EJSON.fromJSONValue(replaceNames(unmakeMongoLegal, document));                              // 43
  }                                                                                                    // 44
  return undefined;                                                                                    // 45
};                                                                                                     // 46
                                                                                                       // 47
var replaceMeteorAtomWithMongo = function (document) {                                                 // 48
  if (EJSON.isBinary(document)) {                                                                      // 49
    // This does more copies than we'd like, but is necessary because                                  // 50
    // MongoDB.BSON only looks like it takes a Uint8Array (and doesn't actually                        // 51
    // serialize it correctly).                                                                        // 52
    return new MongoDB.Binary(new Buffer(document));                                                   // 53
  }                                                                                                    // 54
  if (document instanceof Meteor.Collection.ObjectID) {                                                // 55
    return new MongoDB.ObjectID(document.toHexString());                                               // 56
  } else if (EJSON._isCustomType(document)) {                                                          // 57
    return replaceNames(makeMongoLegal, EJSON.toJSONValue(document));                                  // 58
  }                                                                                                    // 59
  // It is not ordinarily possible to stick dollar-sign keys into mongo                                // 60
  // so we don't bother checking for things that need escaping at this time.                           // 61
  return undefined;                                                                                    // 62
};                                                                                                     // 63
                                                                                                       // 64
var replaceTypes = function (document, atomTransformer) {                                              // 65
  if (typeof document !== 'object' || document === null)                                               // 66
    return document;                                                                                   // 67
                                                                                                       // 68
  var replacedTopLevelAtom = atomTransformer(document);                                                // 69
  if (replacedTopLevelAtom !== undefined)                                                              // 70
    return replacedTopLevelAtom;                                                                       // 71
                                                                                                       // 72
  var ret = document;                                                                                  // 73
  _.each(document, function (val, key) {                                                               // 74
    var valReplaced = replaceTypes(val, atomTransformer);                                              // 75
    if (val !== valReplaced) {                                                                         // 76
      // Lazy clone. Shallow copy.                                                                     // 77
      if (ret === document)                                                                            // 78
        ret = _.clone(document);                                                                       // 79
      ret[key] = valReplaced;                                                                          // 80
    }                                                                                                  // 81
  });                                                                                                  // 82
  return ret;                                                                                          // 83
};                                                                                                     // 84
                                                                                                       // 85
                                                                                                       // 86
MongoConnection = function (url) {                                                                     // 87
  var self = this;                                                                                     // 88
  self._connectCallbacks = [];                                                                         // 89
  self._liveResultsSets = {};                                                                          // 90
                                                                                                       // 91
  var options = {db: {safe: true}};                                                                    // 92
                                                                                                       // 93
  // Set autoReconnect to true, unless passed on the URL. Why someone                                  // 94
  // would want to set autoReconnect to false, I'm not really sure, but                                // 95
  // keeping this for backwards compatibility for now.                                                 // 96
  if (!(/[\?&]auto_?[rR]econnect=/.test(url))) {                                                       // 97
    options.server = {auto_reconnect: true};                                                           // 98
  }                                                                                                    // 99
                                                                                                       // 100
  // Disable the native parser by default, unless specifically enabled                                 // 101
  // in the mongo URL.                                                                                 // 102
  // - The native driver can cause errors which normally would be                                      // 103
  //   thrown, caught, and handled into segfaults that take down the                                   // 104
  //   whole app.                                                                                      // 105
  // - Binary modules don't yet work when you bundle and move the bundle                               // 106
  //   to a different platform (aka deploy)                                                            // 107
  // We should revisit this after binary npm module support lands.                                     // 108
  if (!(/[\?&]native_?[pP]arser=/.test(url))) {                                                        // 109
    options.db.native_parser = false;                                                                  // 110
  }                                                                                                    // 111
                                                                                                       // 112
  MongoDB.connect(url, options, function(err, db) {                                                    // 113
    if (err)                                                                                           // 114
      throw err;                                                                                       // 115
    self.db = db;                                                                                      // 116
                                                                                                       // 117
    Fiber(function () {                                                                                // 118
      // drain queue of pending callbacks                                                              // 119
      _.each(self._connectCallbacks, function (c) {                                                    // 120
        c(db);                                                                                         // 121
      });                                                                                              // 122
    }).run();                                                                                          // 123
  });                                                                                                  // 124
};                                                                                                     // 125
                                                                                                       // 126
MongoConnection.prototype.close = function() {                                                         // 127
  var self = this;                                                                                     // 128
  // Use Future.wrap so that errors get thrown. This happens to                                        // 129
  // work even outside a fiber since the 'close' method is not                                         // 130
  // actually asynchronous.                                                                            // 131
  Future.wrap(_.bind(self.db.close, self.db))(true).wait();                                            // 132
};                                                                                                     // 133
                                                                                                       // 134
MongoConnection.prototype._withDb = function (callback) {                                              // 135
  var self = this;                                                                                     // 136
  if (self.db) {                                                                                       // 137
    callback(self.db);                                                                                 // 138
  } else {                                                                                             // 139
    self._connectCallbacks.push(callback);                                                             // 140
  }                                                                                                    // 141
};                                                                                                     // 142
                                                                                                       // 143
// Returns the Mongo Collection object; may yield.                                                     // 144
MongoConnection.prototype._getCollection = function (collectionName) {                                 // 145
  var self = this;                                                                                     // 146
                                                                                                       // 147
  var future = new Future;                                                                             // 148
  self._withDb(function (db) {                                                                         // 149
    db.collection(collectionName, future.resolver());                                                  // 150
  });                                                                                                  // 151
  return future.wait();                                                                                // 152
};                                                                                                     // 153
                                                                                                       // 154
MongoConnection.prototype._createCappedCollection = function (collectionName,                          // 155
                                                              byteSize) {                              // 156
  var self = this;                                                                                     // 157
  var future = new Future();                                                                           // 158
  self._withDb(function (db) {                                                                         // 159
    db.createCollection(collectionName, {capped: true, size: byteSize},                                // 160
                        future.resolver());                                                            // 161
  });                                                                                                  // 162
  future.wait();                                                                                       // 163
};                                                                                                     // 164
                                                                                                       // 165
// This should be called synchronously with a write, to create a                                       // 166
// transaction on the current write fence, if any. After we can read                                   // 167
// the write, and after observers have been notified (or at least,                                     // 168
// after the observer notifiers have added themselves to the write                                     // 169
// fence), you should call 'committed()' on the object returned.                                       // 170
MongoConnection.prototype._maybeBeginWrite = function () {                                             // 171
  var self = this;                                                                                     // 172
  var fence = DDPServer._CurrentWriteFence.get();                                                      // 173
  if (fence)                                                                                           // 174
    return fence.beginWrite();                                                                         // 175
  else                                                                                                 // 176
    return {committed: function () {}};                                                                // 177
};                                                                                                     // 178
                                                                                                       // 179
//////////// Public API //////////                                                                     // 180
                                                                                                       // 181
// The write methods block until the database has confirmed the write (it may                          // 182
// not be replicated or stable on disk, but one server has confirmed it) if no                         // 183
// callback is provided. If a callback is provided, then they call the callback                        // 184
// when the write is confirmed. They return nothing on success, and raise an                           // 185
// exception on failure.                                                                               // 186
//                                                                                                     // 187
// After making a write (with insert, update, remove), observers are                                   // 188
// notified asynchronously. If you want to receive a callback once all                                 // 189
// of the observer notifications have landed for your write, do the                                    // 190
// writes inside a write fence (set DDPServer._CurrentWriteFence to a new                              // 191
// _WriteFence, and then set a callback on the write fence.)                                           // 192
//                                                                                                     // 193
// Since our execution environment is single-threaded, this is                                         // 194
// well-defined -- a write "has been made" if it's returned, and an                                    // 195
// observer "has been notified" if its callback has returned.                                          // 196
                                                                                                       // 197
var writeCallback = function (write, refresh, callback) {                                              // 198
  return function (err, result) {                                                                      // 199
    if (! err) {                                                                                       // 200
      // XXX We don't have to run this on error, right?                                                // 201
      refresh();                                                                                       // 202
    }                                                                                                  // 203
    write.committed();                                                                                 // 204
    if (callback)                                                                                      // 205
      callback(err, result);                                                                           // 206
    else if (err)                                                                                      // 207
      throw err;                                                                                       // 208
  };                                                                                                   // 209
};                                                                                                     // 210
                                                                                                       // 211
var bindEnvironmentForWrite = function (callback) {                                                    // 212
  return Meteor.bindEnvironment(callback, function (err) {                                             // 213
    Meteor._debug("Error in Mongo write:", err.stack);                                                 // 214
  });                                                                                                  // 215
};                                                                                                     // 216
                                                                                                       // 217
MongoConnection.prototype._insert = function (collection_name, document,                               // 218
                                              callback) {                                              // 219
  var self = this;                                                                                     // 220
  if (collection_name === "___meteor_failure_test_collection") {                                       // 221
    var e = new Error("Failure test");                                                                 // 222
    e.expected = true;                                                                                 // 223
    if (callback)                                                                                      // 224
      return callback(e);                                                                              // 225
    else                                                                                               // 226
      throw e;                                                                                         // 227
  }                                                                                                    // 228
                                                                                                       // 229
  var write = self._maybeBeginWrite();                                                                 // 230
  var refresh = function () {                                                                          // 231
    Meteor.refresh({ collection: collection_name, id: document._id });                                 // 232
  };                                                                                                   // 233
  callback = bindEnvironmentForWrite(writeCallback(write, refresh, callback));                         // 234
  try {                                                                                                // 235
    var collection = self._getCollection(collection_name);                                             // 236
    collection.insert(replaceTypes(document, replaceMeteorAtomWithMongo),                              // 237
                      {safe: true}, callback);                                                         // 238
  } catch (e) {                                                                                        // 239
    write.committed();                                                                                 // 240
    throw e;                                                                                           // 241
  }                                                                                                    // 242
};                                                                                                     // 243
                                                                                                       // 244
// Cause queries that may be affected by the selector to poll in this write                            // 245
// fence.                                                                                              // 246
MongoConnection.prototype._refresh = function (collectionName, selector) {                             // 247
  var self = this;                                                                                     // 248
  var refreshKey = {collection: collectionName};                                                       // 249
  // If we know which documents we're removing, don't poll queries that are                            // 250
  // specific to other documents. (Note that multiple notifications here should                        // 251
  // not cause multiple polls, since all our listener is doing is enqueueing a                         // 252
  // poll.)                                                                                            // 253
  var specificIds = LocalCollection._idsMatchedBySelector(selector);                                   // 254
  if (specificIds) {                                                                                   // 255
    _.each(specificIds, function (id) {                                                                // 256
      Meteor.refresh(_.extend({id: id}, refreshKey));                                                  // 257
    });                                                                                                // 258
  } else {                                                                                             // 259
    Meteor.refresh(refreshKey);                                                                        // 260
  }                                                                                                    // 261
};                                                                                                     // 262
                                                                                                       // 263
MongoConnection.prototype._remove = function (collection_name, selector,                               // 264
                                              callback) {                                              // 265
  var self = this;                                                                                     // 266
                                                                                                       // 267
  if (collection_name === "___meteor_failure_test_collection") {                                       // 268
    var e = new Error("Failure test");                                                                 // 269
    e.expected = true;                                                                                 // 270
    if (callback)                                                                                      // 271
      return callback(e);                                                                              // 272
    else                                                                                               // 273
      throw e;                                                                                         // 274
  }                                                                                                    // 275
                                                                                                       // 276
  var write = self._maybeBeginWrite();                                                                 // 277
  var refresh = function () {                                                                          // 278
    self._refresh(collection_name, selector);                                                          // 279
  };                                                                                                   // 280
  callback = bindEnvironmentForWrite(writeCallback(write, refresh, callback));                         // 281
                                                                                                       // 282
  try {                                                                                                // 283
    var collection = self._getCollection(collection_name);                                             // 284
    collection.remove(replaceTypes(selector, replaceMeteorAtomWithMongo),                              // 285
                      {safe: true}, callback);                                                         // 286
  } catch (e) {                                                                                        // 287
    write.committed();                                                                                 // 288
    throw e;                                                                                           // 289
  }                                                                                                    // 290
};                                                                                                     // 291
                                                                                                       // 292
MongoConnection.prototype._update = function (collection_name, selector, mod,                          // 293
                                              options, callback) {                                     // 294
  var self = this;                                                                                     // 295
                                                                                                       // 296
  if (! callback && options instanceof Function) {                                                     // 297
    callback = options;                                                                                // 298
    options = null;                                                                                    // 299
  }                                                                                                    // 300
                                                                                                       // 301
  if (collection_name === "___meteor_failure_test_collection") {                                       // 302
    var e = new Error("Failure test");                                                                 // 303
    e.expected = true;                                                                                 // 304
    if (callback)                                                                                      // 305
      return callback(e);                                                                              // 306
    else                                                                                               // 307
      throw e;                                                                                         // 308
  }                                                                                                    // 309
                                                                                                       // 310
  // explicit safety check. null and undefined can crash the mongo                                     // 311
  // driver. Although the node driver and minimongo do 'support'                                       // 312
  // non-object modifier in that they don't crash, they are not                                        // 313
  // meaningful operations and do not do anything. Defensively throw an                                // 314
  // error here.                                                                                       // 315
  if (!mod || typeof mod !== 'object')                                                                 // 316
    throw new Error("Invalid modifier. Modifier must be an object.");                                  // 317
                                                                                                       // 318
  if (!options) options = {};                                                                          // 319
                                                                                                       // 320
  var write = self._maybeBeginWrite();                                                                 // 321
  var refresh = function () {                                                                          // 322
    self._refresh(collection_name, selector);                                                          // 323
  };                                                                                                   // 324
  callback = writeCallback(write, refresh, callback);                                                  // 325
  try {                                                                                                // 326
    var collection = self._getCollection(collection_name);                                             // 327
    var mongoOpts = {safe: true};                                                                      // 328
    // explictly enumerate options that minimongo supports                                             // 329
    if (options.upsert) mongoOpts.upsert = true;                                                       // 330
    if (options.multi) mongoOpts.multi = true;                                                         // 331
                                                                                                       // 332
    var mongoSelector = replaceTypes(selector, replaceMeteorAtomWithMongo);                            // 333
    var mongoMod = replaceTypes(mod, replaceMeteorAtomWithMongo);                                      // 334
                                                                                                       // 335
    var isModify = isModificationMod(mongoMod);                                                        // 336
    var knownId = (isModify ? selector._id : mod._id);                                                 // 337
                                                                                                       // 338
    if (options.upsert && (! knownId) && options.insertedId) {                                         // 339
      // XXX In future we could do a real upsert for the mongo id generation                           // 340
      // case, if the the node mongo driver gives us back the id of the upserted                       // 341
      // doc (which our current version does not).                                                     // 342
      simulateUpsertWithInsertedId(                                                                    // 343
        collection, mongoSelector, mongoMod,                                                           // 344
        isModify, options,                                                                             // 345
        // This callback does not need to be bindEnvironment'ed because                                // 346
        // simulateUpsertWithInsertedId() wraps it and then passes it through                          // 347
        // bindEnvironmentForWrite.                                                                    // 348
        function (err, result) {                                                                       // 349
          // If we got here via a upsert() call, then options._returnObject will                       // 350
          // be set and we should return the whole object. Otherwise, we should                        // 351
          // just return the number of affected docs to match the mongo API.                           // 352
          if (result && ! options._returnObject)                                                       // 353
            callback(err, result.numberAffected);                                                      // 354
          else                                                                                         // 355
            callback(err, result);                                                                     // 356
        }                                                                                              // 357
      );                                                                                               // 358
    } else {                                                                                           // 359
      collection.update(                                                                               // 360
        mongoSelector, mongoMod, mongoOpts,                                                            // 361
        bindEnvironmentForWrite(function (err, result, extra) {                                        // 362
          if (! err) {                                                                                 // 363
            if (result && options._returnObject) {                                                     // 364
              result = { numberAffected: result };                                                     // 365
              // If this was an upsert() call, and we ended up                                         // 366
              // inserting a new doc and we know its id, then                                          // 367
              // return that id as well.                                                               // 368
              if (options.upsert && knownId &&                                                         // 369
                  ! extra.updatedExisting)                                                             // 370
                result.insertedId = knownId;                                                           // 371
            }                                                                                          // 372
          }                                                                                            // 373
          callback(err, result);                                                                       // 374
        }));                                                                                           // 375
    }                                                                                                  // 376
  } catch (e) {                                                                                        // 377
    write.committed();                                                                                 // 378
    throw e;                                                                                           // 379
  }                                                                                                    // 380
};                                                                                                     // 381
                                                                                                       // 382
var isModificationMod = function (mod) {                                                               // 383
  for (var k in mod)                                                                                   // 384
    if (k.substr(0, 1) === '$')                                                                        // 385
      return true;                                                                                     // 386
  return false;                                                                                        // 387
};                                                                                                     // 388
                                                                                                       // 389
var NUM_OPTIMISTIC_TRIES = 3;                                                                          // 390
                                                                                                       // 391
// exposed for testing                                                                                 // 392
MongoConnection._isCannotChangeIdError = function (err) {                                              // 393
  // either of these checks should work, but just to be safe...                                        // 394
  return (err.code === 13596 ||                                                                        // 395
          err.err.indexOf("cannot change _id of a document") === 0);                                   // 396
};                                                                                                     // 397
                                                                                                       // 398
var simulateUpsertWithInsertedId = function (collection, selector, mod,                                // 399
                                             isModify, options, callback) {                            // 400
  // STRATEGY:  First try doing a plain update.  If it affected 0 documents,                           // 401
  // then without affecting the database, we know we should probably do an                             // 402
  // insert.  We then do a *conditional* insert that will fail in the case                             // 403
  // of a race condition.  This conditional insert is actually an                                      // 404
  // upsert-replace with an _id, which will never successfully update an                               // 405
  // existing document.  If this upsert fails with an error saying it                                  // 406
  // couldn't change an existing _id, then we know an intervening write has                            // 407
  // caused the query to match something.  We go back to step one and repeat.                          // 408
  // Like all "optimistic write" schemes, we rely on the fact that it's                                // 409
  // unlikely our writes will continue to be interfered with under normal                              // 410
  // circumstances (though sufficiently heavy contention with writers                                  // 411
  // disagreeing on the existence of an object will cause writes to fail                               // 412
  // in theory).                                                                                       // 413
                                                                                                       // 414
  var newDoc;                                                                                          // 415
  // Run this code up front so that it fails fast if someone uses                                      // 416
  // a Mongo update operator we don't support.                                                         // 417
  if (isModify) {                                                                                      // 418
    // We've already run replaceTypes/replaceMeteorAtomWithMongo on                                    // 419
    // selector and mod.  We assume it doesn't matter, as far as                                       // 420
    // the behavior of modifiers is concerned, whether `_modify`                                       // 421
    // is run on EJSON or on mongo-converted EJSON.                                                    // 422
    var selectorDoc = LocalCollection._removeDollarOperators(selector);                                // 423
    LocalCollection._modify(selectorDoc, mod, true);                                                   // 424
    newDoc = selectorDoc;                                                                              // 425
  } else {                                                                                             // 426
    newDoc = mod;                                                                                      // 427
  }                                                                                                    // 428
                                                                                                       // 429
  var insertedId = options.insertedId; // must exist                                                   // 430
  var mongoOptsForUpdate = {                                                                           // 431
    safe: true,                                                                                        // 432
    multi: options.multi                                                                               // 433
  };                                                                                                   // 434
  var mongoOptsForInsert = {                                                                           // 435
    safe: true,                                                                                        // 436
    upsert: true                                                                                       // 437
  };                                                                                                   // 438
                                                                                                       // 439
  var tries = NUM_OPTIMISTIC_TRIES;                                                                    // 440
                                                                                                       // 441
  var doUpdate = function () {                                                                         // 442
    tries--;                                                                                           // 443
    if (! tries) {                                                                                     // 444
      callback(new Error("Upsert failed after " + NUM_OPTIMISTIC_TRIES + " tries."));                  // 445
    } else {                                                                                           // 446
      collection.update(selector, mod, mongoOptsForUpdate,                                             // 447
                        bindEnvironmentForWrite(function (err, result) {                               // 448
                          if (err)                                                                     // 449
                            callback(err);                                                             // 450
                          else if (result)                                                             // 451
                            callback(null, {                                                           // 452
                              numberAffected: result                                                   // 453
                            });                                                                        // 454
                          else                                                                         // 455
                            doConditionalInsert();                                                     // 456
                        }));                                                                           // 457
    }                                                                                                  // 458
  };                                                                                                   // 459
                                                                                                       // 460
  var doConditionalInsert = function () {                                                              // 461
    var replacementWithId = _.extend(                                                                  // 462
      replaceTypes({_id: insertedId}, replaceMeteorAtomWithMongo),                                     // 463
      newDoc);                                                                                         // 464
    collection.update(selector, replacementWithId, mongoOptsForInsert,                                 // 465
                      bindEnvironmentForWrite(function (err, result) {                                 // 466
                        if (err) {                                                                     // 467
                          // figure out if this is a                                                   // 468
                          // "cannot change _id of document" error, and                                // 469
                          // if so, try doUpdate() again, up to 3 times.                               // 470
                          if (MongoConnection._isCannotChangeIdError(err)) {                           // 471
                            doUpdate();                                                                // 472
                          } else {                                                                     // 473
                            callback(err);                                                             // 474
                          }                                                                            // 475
                        } else {                                                                       // 476
                          callback(null, {                                                             // 477
                            numberAffected: result,                                                    // 478
                            insertedId: insertedId                                                     // 479
                          });                                                                          // 480
                        }                                                                              // 481
                      }));                                                                             // 482
  };                                                                                                   // 483
                                                                                                       // 484
  doUpdate();                                                                                          // 485
};                                                                                                     // 486
                                                                                                       // 487
_.each(["insert", "update", "remove"], function (method) {                                             // 488
  MongoConnection.prototype[method] = function (/* arguments */) {                                     // 489
    var self = this;                                                                                   // 490
    return Meteor._wrapAsync(self["_" + method]).apply(self, arguments);                               // 491
  };                                                                                                   // 492
});                                                                                                    // 493
                                                                                                       // 494
// XXX MongoConnection.upsert() does not return the id of the inserted document                        // 495
// unless you set it explicitly in the selector or modifier (as a replacement                          // 496
// doc).                                                                                               // 497
MongoConnection.prototype.upsert = function (collectionName, selector, mod,                            // 498
                                             options, callback) {                                      // 499
  var self = this;                                                                                     // 500
  if (typeof options === "function" && ! callback) {                                                   // 501
    callback = options;                                                                                // 502
    options = {};                                                                                      // 503
  }                                                                                                    // 504
                                                                                                       // 505
  return self.update(collectionName, selector, mod,                                                    // 506
                     _.extend({}, options, {                                                           // 507
                       upsert: true,                                                                   // 508
                       _returnObject: true                                                             // 509
                     }), callback);                                                                    // 510
};                                                                                                     // 511
                                                                                                       // 512
MongoConnection.prototype.find = function (collectionName, selector, options) {                        // 513
  var self = this;                                                                                     // 514
                                                                                                       // 515
  if (arguments.length === 1)                                                                          // 516
    selector = {};                                                                                     // 517
                                                                                                       // 518
  return new Cursor(                                                                                   // 519
    self, new CursorDescription(collectionName, selector, options));                                   // 520
};                                                                                                     // 521
                                                                                                       // 522
MongoConnection.prototype.findOne = function (collection_name, selector,                               // 523
                                              options) {                                               // 524
  var self = this;                                                                                     // 525
  if (arguments.length === 1)                                                                          // 526
    selector = {};                                                                                     // 527
                                                                                                       // 528
  options = options || {};                                                                             // 529
  options.limit = 1;                                                                                   // 530
  return self.find(collection_name, selector, options).fetch()[0];                                     // 531
};                                                                                                     // 532
                                                                                                       // 533
// We'll actually design an index API later. For now, we just pass through to                          // 534
// Mongo's, but make it synchronous.                                                                   // 535
MongoConnection.prototype._ensureIndex = function (collectionName, index,                              // 536
                                                   options) {                                          // 537
  var self = this;                                                                                     // 538
  options = _.extend({safe: true}, options);                                                           // 539
                                                                                                       // 540
  // We expect this function to be called at startup, not from within a method,                        // 541
  // so we don't interact with the write fence.                                                        // 542
  var collection = self._getCollection(collectionName);                                                // 543
  var future = new Future;                                                                             // 544
  var indexName = collection.ensureIndex(index, options, future.resolver());                           // 545
  future.wait();                                                                                       // 546
};                                                                                                     // 547
MongoConnection.prototype._dropIndex = function (collectionName, index) {                              // 548
  var self = this;                                                                                     // 549
                                                                                                       // 550
  // This function is only used by test code, not within a method, so we don't                         // 551
  // interact with the write fence.                                                                    // 552
  var collection = self._getCollection(collectionName);                                                // 553
  var future = new Future;                                                                             // 554
  var indexName = collection.dropIndex(index, future.resolver());                                      // 555
  future.wait();                                                                                       // 556
};                                                                                                     // 557
                                                                                                       // 558
// CURSORS                                                                                             // 559
                                                                                                       // 560
// There are several classes which relate to cursors:                                                  // 561
//                                                                                                     // 562
// CursorDescription represents the arguments used to construct a cursor:                              // 563
// collectionName, selector, and (find) options.  Because it is used as a key                          // 564
// for cursor de-dup, everything in it should either be JSON-stringifiable or                          // 565
// not affect observeChanges output (eg, options.transform functions are not                           // 566
// stringifiable but do not affect observeChanges).                                                    // 567
//                                                                                                     // 568
// SynchronousCursor is a wrapper around a MongoDB cursor                                              // 569
// which includes fully-synchronous versions of forEach, etc.                                          // 570
//                                                                                                     // 571
// Cursor is the cursor object returned from find(), which implements the                              // 572
// documented Meteor.Collection cursor API.  It wraps a CursorDescription and a                        // 573
// SynchronousCursor (lazily: it doesn't contact Mongo until you call a method                         // 574
// like fetch or forEach on it).                                                                       // 575
//                                                                                                     // 576
// ObserveHandle is the "observe handle" returned from observeChanges. It has a                        // 577
// reference to a LiveResultsSet.                                                                      // 578
//                                                                                                     // 579
// LiveResultsSet caches the results of a query and reruns it when necessary.                          // 580
// It is hooked up to one or more ObserveHandles; a single LiveResultsSet                              // 581
// can drive multiple sets of observation callbacks if they are for the                                // 582
// same query.                                                                                         // 583
                                                                                                       // 584
                                                                                                       // 585
var CursorDescription = function (collectionName, selector, options) {                                 // 586
  var self = this;                                                                                     // 587
  self.collectionName = collectionName;                                                                // 588
  self.selector = Meteor.Collection._rewriteSelector(selector);                                        // 589
  self.options = options || {};                                                                        // 590
};                                                                                                     // 591
                                                                                                       // 592
var Cursor = function (mongo, cursorDescription) {                                                     // 593
  var self = this;                                                                                     // 594
                                                                                                       // 595
  self._mongo = mongo;                                                                                 // 596
  self._cursorDescription = cursorDescription;                                                         // 597
  self._synchronousCursor = null;                                                                      // 598
};                                                                                                     // 599
                                                                                                       // 600
_.each(['forEach', 'map', 'rewind', 'fetch', 'count'], function (method) {                             // 601
  Cursor.prototype[method] = function () {                                                             // 602
    var self = this;                                                                                   // 603
                                                                                                       // 604
    // You can only observe a tailable cursor.                                                         // 605
    if (self._cursorDescription.options.tailable)                                                      // 606
      throw new Error("Cannot call " + method + " on a tailable cursor");                              // 607
                                                                                                       // 608
    if (!self._synchronousCursor) {                                                                    // 609
      self._synchronousCursor = self._mongo._createSynchronousCursor(                                  // 610
        self._cursorDescription, {                                                                     // 611
          // Make sure that the "self" argument to forEach/map callbacks is the                        // 612
          // Cursor, not the SynchronousCursor.                                                        // 613
          selfForIteration: self,                                                                      // 614
          useTransform: true                                                                           // 615
        });                                                                                            // 616
    }                                                                                                  // 617
                                                                                                       // 618
    return self._synchronousCursor[method].apply(                                                      // 619
      self._synchronousCursor, arguments);                                                             // 620
  };                                                                                                   // 621
});                                                                                                    // 622
                                                                                                       // 623
Cursor.prototype.getTransform = function () {                                                          // 624
  var self = this;                                                                                     // 625
  return self._cursorDescription.options.transform;                                                    // 626
};                                                                                                     // 627
                                                                                                       // 628
// When you call Meteor.publish() with a function that returns a Cursor, we need                       // 629
// to transmute it into the equivalent subscription.  This is the function that                        // 630
// does that.                                                                                          // 631
                                                                                                       // 632
Cursor.prototype._publishCursor = function (sub) {                                                     // 633
  var self = this;                                                                                     // 634
  var collection = self._cursorDescription.collectionName;                                             // 635
  return Meteor.Collection._publishCursor(self, sub, collection);                                      // 636
};                                                                                                     // 637
                                                                                                       // 638
// Used to guarantee that publish functions return at most one cursor per                              // 639
// collection. Private, because we might later have cursors that include                               // 640
// documents from multiple collections somehow.                                                        // 641
Cursor.prototype._getCollectionName = function () {                                                    // 642
  var self = this;                                                                                     // 643
  return self._cursorDescription.collectionName;                                                       // 644
}                                                                                                      // 645
                                                                                                       // 646
Cursor.prototype.observe = function (callbacks) {                                                      // 647
  var self = this;                                                                                     // 648
  return LocalCollection._observeFromObserveChanges(self, callbacks);                                  // 649
};                                                                                                     // 650
                                                                                                       // 651
Cursor.prototype.observeChanges = function (callbacks) {                                               // 652
  var self = this;                                                                                     // 653
  var ordered = LocalCollection._isOrderedChanges(callbacks);                                          // 654
  return self._mongo._observeChanges(                                                                  // 655
    self._cursorDescription, ordered, callbacks);                                                      // 656
};                                                                                                     // 657
                                                                                                       // 658
MongoConnection.prototype._createSynchronousCursor = function(                                         // 659
    cursorDescription, options) {                                                                      // 660
  var self = this;                                                                                     // 661
  options = _.pick(options || {}, 'selfForIteration', 'useTransform');                                 // 662
                                                                                                       // 663
  var collection = self._getCollection(cursorDescription.collectionName);                              // 664
  var cursorOptions = cursorDescription.options;                                                       // 665
  var mongoOptions = {                                                                                 // 666
    sort: cursorOptions.sort,                                                                          // 667
    limit: cursorOptions.limit,                                                                        // 668
    skip: cursorOptions.skip                                                                           // 669
  };                                                                                                   // 670
                                                                                                       // 671
  // Do we want a tailable cursor (which only works on capped collections)?                            // 672
  if (cursorOptions.tailable) {                                                                        // 673
    // We want a tailable cursor...                                                                    // 674
    mongoOptions.tailable = true;                                                                      // 675
    // ... and for the server to wait a bit if any getMore has no data (rather                         // 676
    // than making us put the relevant sleeps in the client)...                                        // 677
    mongoOptions.awaitdata = true;                                                                     // 678
    // ... and to keep querying the server indefinitely rather than just 5 times                       // 679
    // if there's no more data.                                                                        // 680
    mongoOptions.numberOfRetries = -1;                                                                 // 681
  }                                                                                                    // 682
                                                                                                       // 683
  var dbCursor = collection.find(                                                                      // 684
    replaceTypes(cursorDescription.selector, replaceMeteorAtomWithMongo),                              // 685
    cursorOptions.fields, mongoOptions);                                                               // 686
                                                                                                       // 687
  return new SynchronousCursor(dbCursor, cursorDescription, options);                                  // 688
};                                                                                                     // 689
                                                                                                       // 690
var SynchronousCursor = function (dbCursor, cursorDescription, options) {                              // 691
  var self = this;                                                                                     // 692
  options = _.pick(options || {}, 'selfForIteration', 'useTransform');                                 // 693
                                                                                                       // 694
  self._dbCursor = dbCursor;                                                                           // 695
  self._cursorDescription = cursorDescription;                                                         // 696
  // The "self" argument passed to forEach/map callbacks. If we're wrapped                             // 697
  // inside a user-visible Cursor, we want to provide the outer cursor!                                // 698
  self._selfForIteration = options.selfForIteration || self;                                           // 699
  if (options.useTransform && cursorDescription.options.transform) {                                   // 700
    self._transform = Deps._makeNonreactive(                                                           // 701
      cursorDescription.options.transform                                                              // 702
    );                                                                                                 // 703
  } else {                                                                                             // 704
    self._transform = null;                                                                            // 705
  }                                                                                                    // 706
                                                                                                       // 707
  // Need to specify that the callback is the first argument to nextObject,                            // 708
  // since otherwise when we try to call it with no args the driver will                               // 709
  // interpret "undefined" first arg as an options hash and crash.                                     // 710
  self._synchronousNextObject = Future.wrap(                                                           // 711
    dbCursor.nextObject.bind(dbCursor), 0);                                                            // 712
  self._synchronousCount = Future.wrap(dbCursor.count.bind(dbCursor));                                 // 713
  self._visitedIds = {};                                                                               // 714
};                                                                                                     // 715
                                                                                                       // 716
_.extend(SynchronousCursor.prototype, {                                                                // 717
  _nextObject: function () {                                                                           // 718
    var self = this;                                                                                   // 719
    while (true) {                                                                                     // 720
      var doc = self._synchronousNextObject().wait();                                                  // 721
      if (!doc || typeof doc._id === 'undefined') return null;                                         // 722
      doc = replaceTypes(doc, replaceMongoAtomWithMeteor);                                             // 723
                                                                                                       // 724
      if (!self._cursorDescription.options.tailable) {                                                 // 725
        // Did Mongo give us duplicate documents in the same cursor? If so,                            // 726
        // ignore this one. (Do this before the transform, since transform might                       // 727
        // return some unrelated value.) We don't do this for tailable cursors,                        // 728
        // because we want to maintain O(1) memory usage.                                              // 729
        var strId = LocalCollection._idStringify(doc._id);                                             // 730
        if (self._visitedIds[strId]) continue;                                                         // 731
        self._visitedIds[strId] = true;                                                                // 732
      }                                                                                                // 733
                                                                                                       // 734
      if (self._transform)                                                                             // 735
        doc = self._transform(doc);                                                                    // 736
                                                                                                       // 737
      return doc;                                                                                      // 738
    }                                                                                                  // 739
  },                                                                                                   // 740
                                                                                                       // 741
  forEach: function (callback, thisArg) {                                                              // 742
    var self = this;                                                                                   // 743
                                                                                                       // 744
    // We implement the loop ourself instead of using self._dbCursor.each,                             // 745
    // because "each" will call its callback outside of a fiber which makes it                         // 746
    // much more complex to make this function synchronous.                                            // 747
    var index = 0;                                                                                     // 748
    while (true) {                                                                                     // 749
      var doc = self._nextObject();                                                                    // 750
      if (!doc) return;                                                                                // 751
      callback.call(thisArg, doc, index++, self._selfForIteration);                                    // 752
    }                                                                                                  // 753
  },                                                                                                   // 754
                                                                                                       // 755
  // XXX Allow overlapping callback executions if callback yields.                                     // 756
  map: function (callback, thisArg) {                                                                  // 757
    var self = this;                                                                                   // 758
    var res = [];                                                                                      // 759
    self.forEach(function (doc, index) {                                                               // 760
      res.push(callback.call(thisArg, doc, index, self._selfForIteration));                            // 761
    });                                                                                                // 762
    return res;                                                                                        // 763
  },                                                                                                   // 764
                                                                                                       // 765
  rewind: function () {                                                                                // 766
    var self = this;                                                                                   // 767
                                                                                                       // 768
    // known to be synchronous                                                                         // 769
    self._dbCursor.rewind();                                                                           // 770
                                                                                                       // 771
    self._visitedIds = {};                                                                             // 772
  },                                                                                                   // 773
                                                                                                       // 774
  // Mostly usable for tailable cursors.                                                               // 775
  close: function () {                                                                                 // 776
    var self = this;                                                                                   // 777
                                                                                                       // 778
    self._dbCursor.close();                                                                            // 779
  },                                                                                                   // 780
                                                                                                       // 781
  fetch: function () {                                                                                 // 782
    var self = this;                                                                                   // 783
    return self.map(_.identity);                                                                       // 784
  },                                                                                                   // 785
                                                                                                       // 786
  count: function () {                                                                                 // 787
    var self = this;                                                                                   // 788
    return self._synchronousCount().wait();                                                            // 789
  },                                                                                                   // 790
                                                                                                       // 791
  // This method is NOT wrapped in Cursor.                                                             // 792
  getRawObjects: function (ordered) {                                                                  // 793
    var self = this;                                                                                   // 794
    if (ordered) {                                                                                     // 795
      return self.fetch();                                                                             // 796
    } else {                                                                                           // 797
      var results = {};                                                                                // 798
      self.forEach(function (doc) {                                                                    // 799
        results[doc._id] = doc;                                                                        // 800
      });                                                                                              // 801
      return results;                                                                                  // 802
    }                                                                                                  // 803
  }                                                                                                    // 804
});                                                                                                    // 805
                                                                                                       // 806
var nextObserveHandleId = 1;                                                                           // 807
var ObserveHandle = function (liveResultsSet, callbacks) {                                             // 808
  var self = this;                                                                                     // 809
  self._liveResultsSet = liveResultsSet;                                                               // 810
  self._added = callbacks.added;                                                                       // 811
  self._addedBefore = callbacks.addedBefore;                                                           // 812
  self._changed = callbacks.changed;                                                                   // 813
  self._removed = callbacks.removed;                                                                   // 814
  self._moved = callbacks.moved;                                                                       // 815
  self._movedBefore = callbacks.movedBefore;                                                           // 816
  self._observeHandleId = nextObserveHandleId++;                                                       // 817
};                                                                                                     // 818
ObserveHandle.prototype.stop = function () {                                                           // 819
  var self = this;                                                                                     // 820
  self._liveResultsSet._removeObserveHandle(self);                                                     // 821
  self._liveResultsSet = null;                                                                         // 822
};                                                                                                     // 823
                                                                                                       // 824
MongoConnection.prototype._observeChanges = function (                                                 // 825
    cursorDescription, ordered, callbacks) {                                                           // 826
  var self = this;                                                                                     // 827
                                                                                                       // 828
  if (cursorDescription.options.tailable) {                                                            // 829
    return self._observeChangesTailable(cursorDescription, ordered, callbacks);                        // 830
  }                                                                                                    // 831
                                                                                                       // 832
  var observeKey = JSON.stringify(                                                                     // 833
    _.extend({ordered: ordered}, cursorDescription));                                                  // 834
                                                                                                       // 835
  var liveResultsSet;                                                                                  // 836
  var observeHandle;                                                                                   // 837
  var newlyCreated = false;                                                                            // 838
                                                                                                       // 839
  // Find a matching LiveResultsSet, or create a new one. This next block is                           // 840
  // guaranteed to not yield (and it doesn't call anything that can observe a                          // 841
  // new query), so no other calls to this function can interleave with it.                            // 842
  Meteor._noYieldsAllowed(function () {                                                                // 843
    if (_.has(self._liveResultsSets, observeKey)) {                                                    // 844
      liveResultsSet = self._liveResultsSets[observeKey];                                              // 845
    } else {                                                                                           // 846
      // Create a new LiveResultsSet. It is created "locked": no polling can                           // 847
      // take place.                                                                                   // 848
      liveResultsSet = new LiveResultsSet(                                                             // 849
        cursorDescription,                                                                             // 850
        self,                                                                                          // 851
        ordered,                                                                                       // 852
        function () {                                                                                  // 853
          delete self._liveResultsSets[observeKey];                                                    // 854
        },                                                                                             // 855
        callbacks._testOnlyPollCallback);                                                              // 856
      self._liveResultsSets[observeKey] = liveResultsSet;                                              // 857
      newlyCreated = true;                                                                             // 858
    }                                                                                                  // 859
    observeHandle = new ObserveHandle(liveResultsSet, callbacks);                                      // 860
  });                                                                                                  // 861
                                                                                                       // 862
  if (newlyCreated) {                                                                                  // 863
    // This is the first ObserveHandle on this LiveResultsSet.  Add it and run                         // 864
    // the initial synchronous poll (which may yield).                                                 // 865
    liveResultsSet._addFirstObserveHandle(observeHandle);                                              // 866
  } else {                                                                                             // 867
    // Not the first ObserveHandle. Add it to the LiveResultsSet. This call                            // 868
    // yields until we're not in the middle of a poll, and its invocation of the                       // 869
    // initial 'added' callbacks may yield as well. It blocks until the 'added'                        // 870
    // callbacks have fired.                                                                           // 871
    liveResultsSet._addObserveHandleAndSendInitialAdds(observeHandle);                                 // 872
  }                                                                                                    // 873
                                                                                                       // 874
  return observeHandle;                                                                                // 875
};                                                                                                     // 876
                                                                                                       // 877
var LiveResultsSet = function (cursorDescription, mongoHandle, ordered,                                // 878
                               stopCallback, testOnlyPollCallback) {                                   // 879
  var self = this;                                                                                     // 880
                                                                                                       // 881
  self._cursorDescription = cursorDescription;                                                         // 882
  self._mongoHandle = mongoHandle;                                                                     // 883
  self._ordered = ordered;                                                                             // 884
  self._stopCallbacks = [stopCallback];                                                                // 885
                                                                                                       // 886
  // This constructor cannot yield, so we don't create the synchronousCursor yet                       // 887
  // (since that can yield).                                                                           // 888
  self._synchronousCursor = null;                                                                      // 889
                                                                                                       // 890
  // previous results snapshot.  on each poll cycle, diffs against                                     // 891
  // results drives the callbacks.                                                                     // 892
  self._results = ordered ? [] : {};                                                                   // 893
                                                                                                       // 894
  // The number of _pollMongo calls that have been added to self._taskQueue but                        // 895
  // have not started running. Used to make sure we never schedule more than one                       // 896
  // _pollMongo (other than possibly the one that is currently running). It's                          // 897
  // also used by _suspendPolling to pretend there's a poll scheduled. Usually,                        // 898
  // it's either 0 (for "no polls scheduled other than maybe one currently                             // 899
  // running") or 1 (for "a poll scheduled that isn't running yet"), but it can                        // 900
  // also be 2 if incremented by _suspendPolling.                                                      // 901
  self._pollsScheduledButNotStarted = 0;                                                               // 902
  // Number of _addObserveHandleAndSendInitialAdds tasks scheduled but not yet                         // 903
  // running. _removeObserveHandle uses this to know if it's safe to shut down                         // 904
  // this LiveResultsSet.                                                                              // 905
  self._addHandleTasksScheduledButNotPerformed = 0;                                                    // 906
  self._pendingWrites = []; // people to notify when polling completes                                 // 907
                                                                                                       // 908
  // Make sure to create a separately throttled function for each LiveResultsSet                       // 909
  // object.                                                                                           // 910
  self._ensurePollIsScheduled = _.throttle(                                                            // 911
    self._unthrottledEnsurePollIsScheduled, 50 /* ms */);                                              // 912
                                                                                                       // 913
  self._taskQueue = new Meteor._SynchronousQueue();                                                    // 914
                                                                                                       // 915
  // Listen for the invalidation messages that will trigger us to poll the                             // 916
  // database for changes. If this selector specifies specific IDs, specify them                       // 917
  // here, so that updates to different specific IDs don't cause us to poll.                           // 918
  var listenOnTrigger = function (trigger) {                                                           // 919
    var listener = DDPServer._InvalidationCrossbar.listen(                                             // 920
      trigger, function (notification, complete) {                                                     // 921
        // When someone does a transaction that might affect us, schedule a poll                       // 922
        // of the database. If that transaction happens inside of a write fence,                       // 923
        // block the fence until we've polled and notified observers.                                  // 924
        var fence = DDPServer._CurrentWriteFence.get();                                                // 925
        if (fence)                                                                                     // 926
          self._pendingWrites.push(fence.beginWrite());                                                // 927
        // Ensure a poll is scheduled... but if we already know that one is,                           // 928
        // don't hit the throttled _ensurePollIsScheduled function (which might                        // 929
        // lead to us calling it unnecessarily in 50ms).                                               // 930
        if (self._pollsScheduledButNotStarted === 0)                                                   // 931
          self._ensurePollIsScheduled();                                                               // 932
        complete();                                                                                    // 933
      });                                                                                              // 934
    self._stopCallbacks.push(function () { listener.stop(); });                                        // 935
  };                                                                                                   // 936
  var key = {collection: cursorDescription.collectionName};                                            // 937
  var specificIds = LocalCollection._idsMatchedBySelector(                                             // 938
    cursorDescription.selector);                                                                       // 939
  if (specificIds) {                                                                                   // 940
    _.each(specificIds, function (id) {                                                                // 941
      listenOnTrigger(_.extend({id: id}, key));                                                        // 942
    });                                                                                                // 943
  } else {                                                                                             // 944
    listenOnTrigger(key);                                                                              // 945
  }                                                                                                    // 946
                                                                                                       // 947
  // Map from handle ID to ObserveHandle.                                                              // 948
  self._observeHandles = {};                                                                           // 949
                                                                                                       // 950
  self._callbackMultiplexer = {};                                                                      // 951
  var callbackNames = ['added', 'changed', 'removed'];                                                 // 952
  if (self._ordered) {                                                                                 // 953
    callbackNames.push('moved');                                                                       // 954
    callbackNames.push('addedBefore');                                                                 // 955
    callbackNames.push('movedBefore');                                                                 // 956
  }                                                                                                    // 957
  _.each(callbackNames, function (callback) {                                                          // 958
    var handleCallback = '_' + callback;                                                               // 959
    self._callbackMultiplexer[callback] = function () {                                                // 960
      var args = _.toArray(arguments);                                                                 // 961
      // Because callbacks can yield and _removeObserveHandle() (ie,                                   // 962
      // handle.stop()) doesn't synchronize its actions with _taskQueue,                               // 963
      // ObserveHandles can disappear from self._observeHandles during this                            // 964
      // dispatch. Thus, we save a copy of the keys of self._observeHandles                            // 965
      // before we start to iterate, and we check to see if the handle is still                        // 966
      // there each time.                                                                              // 967
      _.each(_.keys(self._observeHandles), function (handleId) {                                       // 968
        var handle = self._observeHandles[handleId];                                                   // 969
        if (handle && handle[handleCallback])                                                          // 970
          handle[handleCallback].apply(null, EJSON.clone(args));                                       // 971
      });                                                                                              // 972
    };                                                                                                 // 973
  });                                                                                                  // 974
                                                                                                       // 975
  // every once and a while, poll even if we don't think we're dirty, for                              // 976
  // eventual consistency with database writes from outside the Meteor                                 // 977
  // universe.                                                                                         // 978
  //                                                                                                   // 979
  // For testing, there's an undocumented callback argument to observeChanges                          // 980
  // which disables time-based polling and gets called at the beginning of each                        // 981
  // poll.                                                                                             // 982
  if (testOnlyPollCallback) {                                                                          // 983
    self._testOnlyPollCallback = testOnlyPollCallback;                                                 // 984
  } else {                                                                                             // 985
    var intervalHandle = Meteor.setInterval(                                                           // 986
      _.bind(self._ensurePollIsScheduled, self), 10 * 1000);                                           // 987
    self._stopCallbacks.push(function () {                                                             // 988
      Meteor.clearInterval(intervalHandle);                                                            // 989
    });                                                                                                // 990
  }                                                                                                    // 991
};                                                                                                     // 992
                                                                                                       // 993
_.extend(LiveResultsSet.prototype, {                                                                   // 994
  _addFirstObserveHandle: function (handle) {                                                          // 995
    var self = this;                                                                                   // 996
    if (! _.isEmpty(self._observeHandles))                                                             // 997
      throw new Error("Not the first observe handle!");                                                // 998
    if (! _.isEmpty(self._results))                                                                    // 999
      throw new Error("Call _addFirstObserveHandle before polling!");                                  // 1000
                                                                                                       // 1001
    self._observeHandles[handle._observeHandleId] = handle;                                            // 1002
                                                                                                       // 1003
    // Run the first _poll() cycle synchronously (delivering results to the                            // 1004
    // first ObserveHandle).                                                                           // 1005
    ++self._pollsScheduledButNotStarted;                                                               // 1006
    self._taskQueue.runTask(function () {                                                              // 1007
      self._pollMongo();                                                                               // 1008
    });                                                                                                // 1009
  },                                                                                                   // 1010
                                                                                                       // 1011
  // This is always called through _.throttle.                                                         // 1012
  _unthrottledEnsurePollIsScheduled: function () {                                                     // 1013
    var self = this;                                                                                   // 1014
    if (self._pollsScheduledButNotStarted > 0)                                                         // 1015
      return;                                                                                          // 1016
    ++self._pollsScheduledButNotStarted;                                                               // 1017
    self._taskQueue.queueTask(function () {                                                            // 1018
      self._pollMongo();                                                                               // 1019
    });                                                                                                // 1020
  },                                                                                                   // 1021
                                                                                                       // 1022
  // test-only interface for controlling polling.                                                      // 1023
  //                                                                                                   // 1024
  // _suspendPolling blocks until any currently running and scheduled polls are                        // 1025
  // done, and prevents any further polls from being scheduled. (new                                   // 1026
  // ObserveHandles can be added and receive their initial added callbacks,                            // 1027
  // though.)                                                                                          // 1028
  //                                                                                                   // 1029
  // _resumePolling immediately polls, and allows further polls to occur.                              // 1030
  _suspendPolling: function() {                                                                        // 1031
    var self = this;                                                                                   // 1032
    // Pretend that there's another poll scheduled (which will prevent                                 // 1033
    // _ensurePollIsScheduled from queueing any more polls).                                           // 1034
    ++self._pollsScheduledButNotStarted;                                                               // 1035
    // Now block until all currently running or scheduled polls are done.                              // 1036
    self._taskQueue.runTask(function() {});                                                            // 1037
                                                                                                       // 1038
    // Confirm that there is only one "poll" (the fake one we're pretending to                         // 1039
    // have) scheduled.                                                                                // 1040
    if (self._pollsScheduledButNotStarted !== 1)                                                       // 1041
      throw new Error("_pollsScheduledButNotStarted is " +                                             // 1042
                      self._pollsScheduledButNotStarted);                                              // 1043
  },                                                                                                   // 1044
  _resumePolling: function() {                                                                         // 1045
    var self = this;                                                                                   // 1046
    // We should be in the same state as in the end of _suspendPolling.                                // 1047
    if (self._pollsScheduledButNotStarted !== 1)                                                       // 1048
      throw new Error("_pollsScheduledButNotStarted is " +                                             // 1049
                      self._pollsScheduledButNotStarted);                                              // 1050
    // Run a poll synchronously (which will counteract the                                             // 1051
    // ++_pollsScheduledButNotStarted from _suspendPolling).                                           // 1052
    self._taskQueue.runTask(function () {                                                              // 1053
      self._pollMongo();                                                                               // 1054
    });                                                                                                // 1055
  },                                                                                                   // 1056
                                                                                                       // 1057
  _pollMongo: function () {                                                                            // 1058
    var self = this;                                                                                   // 1059
    --self._pollsScheduledButNotStarted;                                                               // 1060
                                                                                                       // 1061
    self._testOnlyPollCallback && self._testOnlyPollCallback();                                        // 1062
                                                                                                       // 1063
    // Save the list of pending writes which this round will commit.                                   // 1064
    var writesForCycle = self._pendingWrites;                                                          // 1065
    self._pendingWrites = [];                                                                          // 1066
                                                                                                       // 1067
    // Get the new query results. (These calls can yield.)                                             // 1068
    if (self._synchronousCursor) {                                                                     // 1069
      self._synchronousCursor.rewind();                                                                // 1070
    } else {                                                                                           // 1071
      self._synchronousCursor = self._mongoHandle._createSynchronousCursor(                            // 1072
        self._cursorDescription);                                                                      // 1073
    }                                                                                                  // 1074
    var newResults = self._synchronousCursor.getRawObjects(self._ordered);                             // 1075
    var oldResults = self._results;                                                                    // 1076
                                                                                                       // 1077
    // Run diffs. (This can yield too.)                                                                // 1078
    if (!_.isEmpty(self._observeHandles)) {                                                            // 1079
      LocalCollection._diffQueryChanges(                                                               // 1080
        self._ordered, oldResults, newResults, self._callbackMultiplexer);                             // 1081
    }                                                                                                  // 1082
                                                                                                       // 1083
    // Replace self._results atomically.                                                               // 1084
    self._results = newResults;                                                                        // 1085
                                                                                                       // 1086
    // Mark all the writes which existed before this call as commmitted. (If new                       // 1087
    // writes have shown up in the meantime, there'll already be another                               // 1088
    // _pollMongo task scheduled.)                                                                     // 1089
    _.each(writesForCycle, function (w) {w.committed();});                                             // 1090
  },                                                                                                   // 1091
                                                                                                       // 1092
  // Adds the observe handle to this set and sends its initial added                                   // 1093
  // callbacks. Meteor._SynchronousQueue guarantees that this won't interleave                         // 1094
  // with a call to _pollMongo or another call to this function.                                       // 1095
  _addObserveHandleAndSendInitialAdds: function (handle) {                                             // 1096
    var self = this;                                                                                   // 1097
                                                                                                       // 1098
    // Check this before calling runTask (even though runTask does the same                            // 1099
    // check) so that we don't leak a LiveResultsSet by incrementing                                   // 1100
    // _addHandleTasksScheduledButNotPerformed and never decrementing it.                              // 1101
    if (!self._taskQueue.safeToRunTask())                                                              // 1102
      throw new Error(                                                                                 // 1103
        "Can't call observe() from an observe callback on the same query");                            // 1104
                                                                                                       // 1105
    // Keep track of how many of these tasks are on the queue, so that                                 // 1106
    // _removeObserveHandle knows if it's safe to GC.                                                  // 1107
    ++self._addHandleTasksScheduledButNotPerformed;                                                    // 1108
                                                                                                       // 1109
    self._taskQueue.runTask(function () {                                                              // 1110
      if (!self._observeHandles)                                                                       // 1111
        throw new Error("Can't add observe handle to stopped LiveResultsSet");                         // 1112
                                                                                                       // 1113
      if (_.has(self._observeHandles, handle._observeHandleId))                                        // 1114
        throw new Error("Duplicate observe handle ID");                                                // 1115
      self._observeHandles[handle._observeHandleId] = handle;                                          // 1116
      --self._addHandleTasksScheduledButNotPerformed;                                                  // 1117
                                                                                                       // 1118
      // Send initial adds.                                                                            // 1119
      if (handle._added || handle._addedBefore) {                                                      // 1120
        _.each(self._results, function (doc, i) {                                                      // 1121
          var fields = EJSON.clone(doc);                                                               // 1122
          delete fields._id;                                                                           // 1123
          if (self._ordered) {                                                                         // 1124
            handle._added && handle._added(doc._id, fields);                                           // 1125
            handle._addedBefore && handle._addedBefore(doc._id, fields, null);                         // 1126
          } else {                                                                                     // 1127
            handle._added(doc._id, fields);                                                            // 1128
          }                                                                                            // 1129
        });                                                                                            // 1130
      }                                                                                                // 1131
    });                                                                                                // 1132
  },                                                                                                   // 1133
                                                                                                       // 1134
  // Remove an observe handle. If it was the last observe handle, call all the                         // 1135
  // stop callbacks; you cannot add any more observe handles after this.                               // 1136
  //                                                                                                   // 1137
  // This is not synchronized with polls and handle additions: this means that                         // 1138
  // you can safely call it from within an observe callback.                                           // 1139
  _removeObserveHandle: function (handle) {                                                            // 1140
    var self = this;                                                                                   // 1141
                                                                                                       // 1142
    if (!_.has(self._observeHandles, handle._observeHandleId))                                         // 1143
      throw new Error("Unknown observe handle ID " + handle._observeHandleId);                         // 1144
    delete self._observeHandles[handle._observeHandleId];                                              // 1145
                                                                                                       // 1146
    if (_.isEmpty(self._observeHandles) &&                                                             // 1147
        self._addHandleTasksScheduledButNotPerformed === 0) {                                          // 1148
      // The last observe handle was stopped; call our stop callbacks, which:                          // 1149
      //  - removes us from the MongoConnection's _liveResultsSets map                                 // 1150
      //  - stops the poll timer                                                                       // 1151
      //  - removes us from the invalidation crossbar                                                  // 1152
      _.each(self._stopCallbacks, function (c) { c(); });                                              // 1153
      // This will cause future _addObserveHandleAndSendInitialAdds calls to                           // 1154
      // throw.                                                                                        // 1155
      self._observeHandles = null;                                                                     // 1156
    }                                                                                                  // 1157
  }                                                                                                    // 1158
});                                                                                                    // 1159
                                                                                                       // 1160
// observeChanges for tailable cursors on capped collections.                                          // 1161
//                                                                                                     // 1162
// Some differences from normal cursors:                                                               // 1163
//   - Will never produce anything other than 'added' or 'addedBefore'. If you                         // 1164
//     do update a document that has already been produced, this will not notice                       // 1165
//     it.                                                                                             // 1166
//   - If you disconnect and reconnect from Mongo, it will essentially restart                         // 1167
//     the query, which will lead to duplicate results. This is pretty bad,                            // 1168
//     but if you include a field called 'ts' which is inserted as                                     // 1169
//     new MongoInternals.MongoTimestamp(0, 0) (which is initialized to the                            // 1170
//     current Mongo-style timestamp), we'll be able to find the place to                              // 1171
//     restart properly. (This field is specifically understood by Mongo with an                       // 1172
//     optimization which allows it to find the right place to start without                           // 1173
//     an index on ts. It's how the oplog works.)                                                      // 1174
//   - No callbacks are triggered synchronously with the call (there's no                              // 1175
//     differentiation between "initial data" and "later changes"; everything                          // 1176
//     that matches the query gets sent asynchronously).                                               // 1177
//   - De-duplication is not implemented.                                                              // 1178
//   - Does not yet interact with the write fence. Probably, this should work by                       // 1179
//     ignoring removes (which don't work on capped collections) and updates                           // 1180
//     (which don't affect tailable cursors), and just keeping track of the ID                         // 1181
//     of the inserted object, and closing the write fence once you get to that                        // 1182
//     ID (or timestamp?).  This doesn't work well if the document doesn't match                       // 1183
//     the query, though.  On the other hand, the write fence can close                                // 1184
//     immediately if it does not match the query. So if we trust minimongo                            // 1185
//     enough to accurately evaluate the query against the write fence, we                             // 1186
//     should be able to do this...  Of course, minimongo doesn't even support                         // 1187
//     Mongo Timestamps yet.                                                                           // 1188
MongoConnection.prototype._observeChangesTailable = function (                                         // 1189
    cursorDescription, ordered, callbacks) {                                                           // 1190
  var self = this;                                                                                     // 1191
                                                                                                       // 1192
  // Tailable cursors only ever call added/addedBefore callbacks, so it's an                           // 1193
  // error if you didn't provide them.                                                                 // 1194
  if ((ordered && !callbacks.addedBefore) ||                                                           // 1195
      (!ordered && !callbacks.added)) {                                                                // 1196
    throw new Error("Can't observe an " + (ordered ? "ordered" : "unordered")                          // 1197
                    + " tailable cursor without a "                                                    // 1198
                    + (ordered ? "addedBefore" : "added") + " callback");                              // 1199
  }                                                                                                    // 1200
  var cursor = self._createSynchronousCursor(cursorDescription);                                       // 1201
                                                                                                       // 1202
  var stopped = false;                                                                                 // 1203
  var lastTS = undefined;                                                                              // 1204
  Meteor.defer(function () {                                                                           // 1205
    while (true) {                                                                                     // 1206
      if (stopped)                                                                                     // 1207
        return;                                                                                        // 1208
      try {                                                                                            // 1209
        var doc = cursor._nextObject();                                                                // 1210
      } catch (err) {                                                                                  // 1211
        // There's no good way to figure out if this was actually an error from                        // 1212
        // Mongo. Ah well. But either way, we need to retry the cursor (unless                         // 1213
        // the failure was because the observe got stopped).                                           // 1214
        doc = null;                                                                                    // 1215
      }                                                                                                // 1216
      if (stopped)                                                                                     // 1217
        return;                                                                                        // 1218
      if (doc) {                                                                                       // 1219
        var id = doc._id;                                                                              // 1220
        delete doc._id;                                                                                // 1221
        // If a tailable cursor contains a "ts" field, use it to recreate the                          // 1222
        // cursor on error, and don't publish the field. ("ts" is a standard                           // 1223
        // that Mongo uses internally for the oplog, and there's a special flag                        // 1224
        // that lets you do binary search on it instead of needing to use an                           // 1225
        // index.)                                                                                     // 1226
        lastTS = doc.ts;                                                                               // 1227
        delete doc.ts;                                                                                 // 1228
        if (ordered) {                                                                                 // 1229
          callbacks.addedBefore(id, doc, null);                                                        // 1230
        } else {                                                                                       // 1231
          callbacks.added(id, doc);                                                                    // 1232
        }                                                                                              // 1233
      } else {                                                                                         // 1234
        var newSelector = _.clone(cursorDescription.selector);                                         // 1235
        if (lastTS) {                                                                                  // 1236
          newSelector.ts = {$gt: lastTS};                                                              // 1237
        }                                                                                              // 1238
        // XXX maybe set replay flag                                                                   // 1239
        cursor = self._createSynchronousCursor(new CursorDescription(                                  // 1240
          cursorDescription.collectionName,                                                            // 1241
          newSelector,                                                                                 // 1242
          cursorDescription.options));                                                                 // 1243
      }                                                                                                // 1244
    }                                                                                                  // 1245
  });                                                                                                  // 1246
                                                                                                       // 1247
  return {                                                                                             // 1248
    stop: function () {                                                                                // 1249
      stopped = true;                                                                                  // 1250
      cursor.close();                                                                                  // 1251
    }                                                                                                  // 1252
  };                                                                                                   // 1253
};                                                                                                     // 1254
                                                                                                       // 1255
// XXX We probably need to find a better way to expose this. Right now                                 // 1256
// it's only used by tests, but in fact you need it in normal                                          // 1257
// operation to interact with capped collections (eg, Galaxy uses it).                                 // 1258
MongoInternals.MongoTimestamp = MongoDB.Timestamp;                                                     // 1259
                                                                                                       // 1260
MongoInternals.Connection = MongoConnection;                                                           // 1261
                                                                                                       // 1262
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/mongo-livedata/local_collection_driver.js                                                  //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
LocalCollectionDriver = function () {                                                                  // 1
  var self = this;                                                                                     // 2
  self.noConnCollections = {};                                                                         // 3
};                                                                                                     // 4
                                                                                                       // 5
var ensureCollection = function (name, collections) {                                                  // 6
  if (!(name in collections))                                                                          // 7
    collections[name] = new LocalCollection(name);                                                     // 8
  return collections[name];                                                                            // 9
};                                                                                                     // 10
                                                                                                       // 11
_.extend(LocalCollectionDriver.prototype, {                                                            // 12
  open: function (name, conn) {                                                                        // 13
    var self = this;                                                                                   // 14
    if (!name)                                                                                         // 15
      return new LocalCollection;                                                                      // 16
    if (! conn) {                                                                                      // 17
      return ensureCollection(name, self.noConnCollections);                                           // 18
    }                                                                                                  // 19
    if (! conn._mongo_livedata_collections)                                                            // 20
      conn._mongo_livedata_collections = {};                                                           // 21
    // XXX is there a way to keep track of a connection's collections without                          // 22
    // dangling it off the connection object?                                                          // 23
    return ensureCollection(name, conn._mongo_livedata_collections);                                   // 24
  }                                                                                                    // 25
});                                                                                                    // 26
                                                                                                       // 27
// singleton                                                                                           // 28
LocalCollectionDriver = new LocalCollectionDriver;                                                     // 29
                                                                                                       // 30
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/mongo-livedata/remote_collection_driver.js                                                 //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
MongoInternals.RemoteCollectionDriver = function (mongo_url) {                                         // 1
  var self = this;                                                                                     // 2
  self.mongo = new MongoConnection(mongo_url);                                                         // 3
};                                                                                                     // 4
                                                                                                       // 5
_.extend(MongoInternals.RemoteCollectionDriver.prototype, {                                            // 6
  open: function (name) {                                                                              // 7
    var self = this;                                                                                   // 8
    var ret = {};                                                                                      // 9
    _.each(                                                                                            // 10
      ['find', 'findOne', 'insert', 'update', , 'upsert',                                              // 11
       'remove', '_ensureIndex', '_dropIndex', '_createCappedCollection'],                             // 12
      function (m) {                                                                                   // 13
        ret[m] = _.bind(self.mongo[m], self.mongo, name);                                              // 14
      });                                                                                              // 15
    return ret;                                                                                        // 16
  }                                                                                                    // 17
});                                                                                                    // 18
                                                                                                       // 19
                                                                                                       // 20
// Create the singleton RemoteCollectionDriver only on demand, so we                                   // 21
// only require Mongo configuration if it's actually used (eg, not if                                  // 22
// you're only trying to receive data from a remote DDP server.)                                       // 23
MongoInternals.defaultRemoteCollectionDriver = _.once(function () {                                    // 24
  var mongoUrl;                                                                                        // 25
  AppConfig.configurePackage("mongo-livedata", function (config) {                                     // 26
    // This will keep running if mongo gets reconfigured.  That's not ideal, but                       // 27
    // should be ok for now.                                                                           // 28
    mongoUrl = config.url;                                                                             // 29
  });                                                                                                  // 30
  // XXX bad error since it could also be set directly in METEOR_DEPLOY_CONFIG                         // 31
  if (! mongoUrl)                                                                                      // 32
    throw new Error("MONGO_URL must be set in environment");                                           // 33
                                                                                                       // 34
  return new MongoInternals.RemoteCollectionDriver(mongoUrl);                                          // 35
});                                                                                                    // 36
                                                                                                       // 37
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/mongo-livedata/collection.js                                                               //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
// options.connection, if given, is a LivedataClient or LivedataServer                                 // 1
// XXX presently there is no way to destroy/clean up a Collection                                      // 2
                                                                                                       // 3
Meteor.Collection = function (name, options) {                                                         // 4
  var self = this;                                                                                     // 5
  if (! (self instanceof Meteor.Collection))                                                           // 6
    throw new Error('use "new" to construct a Meteor.Collection');                                     // 7
  if (options && options.methods) {                                                                    // 8
    // Backwards compatibility hack with original signature (which passed                              // 9
    // "connection" directly instead of in options. (Connections must have a "methods"                 // 10
    // method.)                                                                                        // 11
    // XXX remove before 1.0                                                                           // 12
    options = {connection: options};                                                                   // 13
  }                                                                                                    // 14
  // Backwards compatibility: "connection" used to be called "manager".                                // 15
  if (options && options.manager && !options.connection) {                                             // 16
    options.connection = options.manager;                                                              // 17
  }                                                                                                    // 18
  options = _.extend({                                                                                 // 19
    connection: undefined,                                                                             // 20
    idGeneration: 'STRING',                                                                            // 21
    transform: null,                                                                                   // 22
    _driver: undefined,                                                                                // 23
    _preventAutopublish: false                                                                         // 24
  }, options);                                                                                         // 25
                                                                                                       // 26
  switch (options.idGeneration) {                                                                      // 27
  case 'MONGO':                                                                                        // 28
    self._makeNewID = function () {                                                                    // 29
      return new Meteor.Collection.ObjectID();                                                         // 30
    };                                                                                                 // 31
    break;                                                                                             // 32
  case 'STRING':                                                                                       // 33
  default:                                                                                             // 34
    self._makeNewID = function () {                                                                    // 35
      return Random.id();                                                                              // 36
    };                                                                                                 // 37
    break;                                                                                             // 38
  }                                                                                                    // 39
                                                                                                       // 40
  if (options.transform)                                                                               // 41
    self._transform = Deps._makeNonreactive(options.transform);                                        // 42
  else                                                                                                 // 43
    self._transform = null;                                                                            // 44
                                                                                                       // 45
  if (!name && (name !== null)) {                                                                      // 46
    Meteor._debug("Warning: creating anonymous collection. It will not be " +                          // 47
                  "saved or synchronized over the network. (Pass null for " +                          // 48
                  "the collection name to turn off this warning.)");                                   // 49
  }                                                                                                    // 50
                                                                                                       // 51
  if (! name || options.connection === null)                                                           // 52
    // note: nameless collections never have a connection                                              // 53
    self._connection = null;                                                                           // 54
  else if (options.connection)                                                                         // 55
    self._connection = options.connection;                                                             // 56
  else if (Meteor.isClient)                                                                            // 57
    self._connection = Meteor.connection;                                                              // 58
  else                                                                                                 // 59
    self._connection = Meteor.server;                                                                  // 60
                                                                                                       // 61
  if (!options._driver) {                                                                              // 62
    if (name && self._connection === Meteor.server &&                                                  // 63
        typeof MongoInternals !== "undefined" &&                                                       // 64
        MongoInternals.defaultRemoteCollectionDriver) {                                                // 65
      options._driver = MongoInternals.defaultRemoteCollectionDriver();                                // 66
    } else {                                                                                           // 67
      options._driver = LocalCollectionDriver;                                                         // 68
    }                                                                                                  // 69
  }                                                                                                    // 70
                                                                                                       // 71
  self._collection = options._driver.open(name, self._connection);                                     // 72
  self._name = name;                                                                                   // 73
                                                                                                       // 74
  if (self._connection && self._connection.registerStore) {                                            // 75
    // OK, we're going to be a slave, replicating some remote                                          // 76
    // database, except possibly with some temporary divergence while                                  // 77
    // we have unacknowledged RPC's.                                                                   // 78
    var ok = self._connection.registerStore(name, {                                                    // 79
      // Called at the beginning of a batch of updates. batchSize is the number                        // 80
      // of update calls to expect.                                                                    // 81
      //                                                                                               // 82
      // XXX This interface is pretty janky. reset probably ought to go back to                        // 83
      // being its own function, and callers shouldn't have to calculate                               // 84
      // batchSize. The optimization of not calling pause/remove should be                             // 85
      // delayed until later: the first call to update() should buffer its                             // 86
      // message, and then we can either directly apply it at endUpdate time if                        // 87
      // it was the only update, or do pauseObservers/apply/apply at the next                          // 88
      // update() if there's another one.                                                              // 89
      beginUpdate: function (batchSize, reset) {                                                       // 90
        // pause observers so users don't see flicker when updating several                            // 91
        // objects at once (including the post-reconnect reset-and-reapply                             // 92
        // stage), and so that a re-sorting of a query can take advantage of the                       // 93
        // full _diffQuery moved calculation instead of applying change one at a                       // 94
        // time.                                                                                       // 95
        if (batchSize > 1 || reset)                                                                    // 96
          self._collection.pauseObservers();                                                           // 97
                                                                                                       // 98
        if (reset)                                                                                     // 99
          self._collection.remove({});                                                                 // 100
      },                                                                                               // 101
                                                                                                       // 102
      // Apply an update.                                                                              // 103
      // XXX better specify this interface (not in terms of a wire message)?                           // 104
      update: function (msg) {                                                                         // 105
        var mongoId = LocalCollection._idParse(msg.id);                                                // 106
        var doc = self._collection.findOne(mongoId);                                                   // 107
                                                                                                       // 108
        // Is this a "replace the whole doc" message coming from the quiescence                        // 109
        // of method writes to an object? (Note that 'undefined' is a valid                            // 110
        // value meaning "remove it".)                                                                 // 111
        if (msg.msg === 'replace') {                                                                   // 112
          var replace = msg.replace;                                                                   // 113
          if (!replace) {                                                                              // 114
            if (doc)                                                                                   // 115
              self._collection.remove(mongoId);                                                        // 116
          } else if (!doc) {                                                                           // 117
            self._collection.insert(replace);                                                          // 118
          } else {                                                                                     // 119
            // XXX check that replace has no $ ops                                                     // 120
            self._collection.update(mongoId, replace);                                                 // 121
          }                                                                                            // 122
          return;                                                                                      // 123
        } else if (msg.msg === 'added') {                                                              // 124
          if (doc) {                                                                                   // 125
            throw new Error("Expected not to find a document already present for an add");             // 126
          }                                                                                            // 127
          self._collection.insert(_.extend({_id: mongoId}, msg.fields));                               // 128
        } else if (msg.msg === 'removed') {                                                            // 129
          if (!doc)                                                                                    // 130
            throw new Error("Expected to find a document already present for removed");                // 131
          self._collection.remove(mongoId);                                                            // 132
        } else if (msg.msg === 'changed') {                                                            // 133
          if (!doc)                                                                                    // 134
            throw new Error("Expected to find a document to change");                                  // 135
          if (!_.isEmpty(msg.fields)) {                                                                // 136
            var modifier = {};                                                                         // 137
            _.each(msg.fields, function (value, key) {                                                 // 138
              if (value === undefined) {                                                               // 139
                if (!modifier.$unset)                                                                  // 140
                  modifier.$unset = {};                                                                // 141
                modifier.$unset[key] = 1;                                                              // 142
              } else {                                                                                 // 143
                if (!modifier.$set)                                                                    // 144
                  modifier.$set = {};                                                                  // 145
                modifier.$set[key] = value;                                                            // 146
              }                                                                                        // 147
            });                                                                                        // 148
            self._collection.update(mongoId, modifier);                                                // 149
          }                                                                                            // 150
        } else {                                                                                       // 151
          throw new Error("I don't know how to deal with this message");                               // 152
        }                                                                                              // 153
                                                                                                       // 154
      },                                                                                               // 155
                                                                                                       // 156
      // Called at the end of a batch of updates.                                                      // 157
      endUpdate: function () {                                                                         // 158
        self._collection.resumeObservers();                                                            // 159
      },                                                                                               // 160
                                                                                                       // 161
      // Called around method stub invocations to capture the original versions                        // 162
      // of modified documents.                                                                        // 163
      saveOriginals: function () {                                                                     // 164
        self._collection.saveOriginals();                                                              // 165
      },                                                                                               // 166
      retrieveOriginals: function () {                                                                 // 167
        return self._collection.retrieveOriginals();                                                   // 168
      }                                                                                                // 169
    });                                                                                                // 170
                                                                                                       // 171
    if (!ok)                                                                                           // 172
      throw new Error("There is already a collection named '" + name + "'");                           // 173
  }                                                                                                    // 174
                                                                                                       // 175
  self._defineMutationMethods();                                                                       // 176
                                                                                                       // 177
  // autopublish                                                                                       // 178
  if (Package.autopublish && !options._preventAutopublish && self._connection                          // 179
      && self._connection.publish) {                                                                   // 180
    self._connection.publish(null, function () {                                                       // 181
      return self.find();                                                                              // 182
    }, {is_auto: true});                                                                               // 183
  }                                                                                                    // 184
};                                                                                                     // 185
                                                                                                       // 186
///                                                                                                    // 187
/// Main collection API                                                                                // 188
///                                                                                                    // 189
                                                                                                       // 190
                                                                                                       // 191
_.extend(Meteor.Collection.prototype, {                                                                // 192
                                                                                                       // 193
  _getFindSelector: function (args) {                                                                  // 194
    if (args.length == 0)                                                                              // 195
      return {};                                                                                       // 196
    else                                                                                               // 197
      return args[0];                                                                                  // 198
  },                                                                                                   // 199
                                                                                                       // 200
  _getFindOptions: function (args) {                                                                   // 201
    var self = this;                                                                                   // 202
    if (args.length < 2) {                                                                             // 203
      return { transform: self._transform };                                                           // 204
    } else {                                                                                           // 205
      return _.extend({                                                                                // 206
        transform: self._transform                                                                     // 207
      }, args[1]);                                                                                     // 208
    }                                                                                                  // 209
  },                                                                                                   // 210
                                                                                                       // 211
  find: function (/* selector, options */) {                                                           // 212
    // Collection.find() (return all docs) behaves differently                                         // 213
    // from Collection.find(undefined) (return 0 docs).  so be                                         // 214
    // careful about the length of arguments.                                                          // 215
    var self = this;                                                                                   // 216
    var argArray = _.toArray(arguments);                                                               // 217
    return self._collection.find(self._getFindSelector(argArray),                                      // 218
                                 self._getFindOptions(argArray));                                      // 219
  },                                                                                                   // 220
                                                                                                       // 221
  findOne: function (/* selector, options */) {                                                        // 222
    var self = this;                                                                                   // 223
    var argArray = _.toArray(arguments);                                                               // 224
    return self._collection.findOne(self._getFindSelector(argArray),                                   // 225
                                    self._getFindOptions(argArray));                                   // 226
  }                                                                                                    // 227
                                                                                                       // 228
});                                                                                                    // 229
                                                                                                       // 230
Meteor.Collection._publishCursor = function (cursor, sub, collection) {                                // 231
  var observeHandle = cursor.observeChanges({                                                          // 232
    added: function (id, fields) {                                                                     // 233
      sub.added(collection, id, fields);                                                               // 234
    },                                                                                                 // 235
    changed: function (id, fields) {                                                                   // 236
      sub.changed(collection, id, fields);                                                             // 237
    },                                                                                                 // 238
    removed: function (id) {                                                                           // 239
      sub.removed(collection, id);                                                                     // 240
    }                                                                                                  // 241
  });                                                                                                  // 242
                                                                                                       // 243
  // We don't call sub.ready() here: it gets called in livedata_server, after                          // 244
  // possibly calling _publishCursor on multiple returned cursors.                                     // 245
                                                                                                       // 246
  // register stop callback (expects lambda w/ no args).                                               // 247
  sub.onStop(function () {observeHandle.stop();});                                                     // 248
};                                                                                                     // 249
                                                                                                       // 250
// protect against dangerous selectors.  falsey and {_id: falsey} are both                             // 251
// likely programmer error, and not what you want, particularly for destructive                        // 252
// operations.  JS regexps don't serialize over DDP but can be trivially                               // 253
// replaced by $regex.                                                                                 // 254
Meteor.Collection._rewriteSelector = function (selector) {                                             // 255
  // shorthand -- scalars match _id                                                                    // 256
  if (LocalCollection._selectorIsId(selector))                                                         // 257
    selector = {_id: selector};                                                                        // 258
                                                                                                       // 259
  if (!selector || (('_id' in selector) && !selector._id))                                             // 260
    // can't match anything                                                                            // 261
    return {_id: Random.id()};                                                                         // 262
                                                                                                       // 263
  var ret = {};                                                                                        // 264
  _.each(selector, function (value, key) {                                                             // 265
    // Mongo supports both {field: /foo/} and {field: {$regex: /foo/}}                                 // 266
    if (value instanceof RegExp) {                                                                     // 267
      ret[key] = convertRegexpToMongoSelector(value);                                                  // 268
    } else if (value && value.$regex instanceof RegExp) {                                              // 269
      ret[key] = convertRegexpToMongoSelector(value.$regex);                                           // 270
      // if value is {$regex: /foo/, $options: ...} then $options                                      // 271
      // override the ones set on $regex.                                                              // 272
      if (value.$options !== undefined)                                                                // 273
        ret[key].$options = value.$options;                                                            // 274
    }                                                                                                  // 275
    else if (_.contains(['$or','$and','$nor'], key)) {                                                 // 276
      // Translate lower levels of $and/$or/$nor                                                       // 277
      ret[key] = _.map(value, function (v) {                                                           // 278
        return Meteor.Collection._rewriteSelector(v);                                                  // 279
      });                                                                                              // 280
    }                                                                                                  // 281
    else {                                                                                             // 282
      ret[key] = value;                                                                                // 283
    }                                                                                                  // 284
  });                                                                                                  // 285
  return ret;                                                                                          // 286
};                                                                                                     // 287
                                                                                                       // 288
// convert a JS RegExp object to a Mongo {$regex: ..., $options: ...}                                  // 289
// selector                                                                                            // 290
var convertRegexpToMongoSelector = function (regexp) {                                                 // 291
  check(regexp, RegExp); // safety belt                                                                // 292
                                                                                                       // 293
  var selector = {$regex: regexp.source};                                                              // 294
  var regexOptions = '';                                                                               // 295
  // JS RegExp objects support 'i', 'm', and 'g'. Mongo regex $options                                 // 296
  // support 'i', 'm', 'x', and 's'. So we support 'i' and 'm' here.                                   // 297
  if (regexp.ignoreCase)                                                                               // 298
    regexOptions += 'i';                                                                               // 299
  if (regexp.multiline)                                                                                // 300
    regexOptions += 'm';                                                                               // 301
  if (regexOptions)                                                                                    // 302
    selector.$options = regexOptions;                                                                  // 303
                                                                                                       // 304
  return selector;                                                                                     // 305
};                                                                                                     // 306
                                                                                                       // 307
var throwIfSelectorIsNotId = function (selector, methodName) {                                         // 308
  if (!LocalCollection._selectorIsIdPerhapsAsObject(selector)) {                                       // 309
    throw new Meteor.Error(                                                                            // 310
      403, "Not permitted. Untrusted code may only " + methodName +                                    // 311
        " documents by ID.");                                                                          // 312
  }                                                                                                    // 313
};                                                                                                     // 314
                                                                                                       // 315
// 'insert' immediately returns the inserted document's new _id.                                       // 316
// The others return values immediately if you are in a stub, an in-memory                             // 317
// unmanaged collection, or a mongo-backed collection and you don't pass a                             // 318
// callback. 'update' and 'remove' return the number of affected                                       // 319
// documents. 'upsert' returns an object with keys 'numberAffected' and, if an                         // 320
// insert happened, 'insertedId'.                                                                      // 321
//                                                                                                     // 322
// Otherwise, the semantics are exactly like other methods: they take                                  // 323
// a callback as an optional last argument; if no callback is                                          // 324
// provided, they block until the operation is complete, and throw an                                  // 325
// exception if it fails; if a callback is provided, then they don't                                   // 326
// necessarily block, and they call the callback when they finish with error and                       // 327
// result arguments.  (The insert method provides the document ID as its result;                       // 328
// update and remove provide the number of affected docs as the result; upsert                         // 329
// provides an object with numberAffected and maybe insertedId.)                                       // 330
//                                                                                                     // 331
// On the client, blocking is impossible, so if a callback                                             // 332
// isn't provided, they just return immediately and any error                                          // 333
// information is lost.                                                                                // 334
//                                                                                                     // 335
// There's one more tweak. On the client, if you don't provide a                                       // 336
// callback, then if there is an error, a message will be logged with                                  // 337
// Meteor._debug.                                                                                      // 338
//                                                                                                     // 339
// The intent (though this is actually determined by the underlying                                    // 340
// drivers) is that the operations should be done synchronously, not                                   // 341
// generating their result until the database has acknowledged                                         // 342
// them. In the future maybe we should provide a flag to turn this                                     // 343
// off.                                                                                                // 344
_.each(["insert", "update", "remove"], function (name) {                                               // 345
  Meteor.Collection.prototype[name] = function (/* arguments */) {                                     // 346
    var self = this;                                                                                   // 347
    var args = _.toArray(arguments);                                                                   // 348
    var callback;                                                                                      // 349
    var insertId;                                                                                      // 350
    var ret;                                                                                           // 351
                                                                                                       // 352
    if (args.length && args[args.length - 1] instanceof Function)                                      // 353
      callback = args.pop();                                                                           // 354
                                                                                                       // 355
    if (name === "insert") {                                                                           // 356
      if (!args.length)                                                                                // 357
        throw new Error("insert requires an argument");                                                // 358
      // shallow-copy the document and generate an ID                                                  // 359
      args[0] = _.extend({}, args[0]);                                                                 // 360
      if ('_id' in args[0]) {                                                                          // 361
        insertId = args[0]._id;                                                                        // 362
        if (!insertId || !(typeof insertId === 'string'                                                // 363
              || insertId instanceof Meteor.Collection.ObjectID))                                      // 364
          throw new Error("Meteor requires document _id fields to be non-empty strings or ObjectIDs"); // 365
      } else {                                                                                         // 366
        insertId = args[0]._id = self._makeNewID();                                                    // 367
      }                                                                                                // 368
    } else {                                                                                           // 369
      args[0] = Meteor.Collection._rewriteSelector(args[0]);                                           // 370
                                                                                                       // 371
      if (name === "update") {                                                                         // 372
        // Mutate args but copy the original options object. We need to add                            // 373
        // insertedId to options, but don't want to mutate the caller's options                        // 374
        // object. We need to mutate `args` because we pass `args` into the                            // 375
        // driver below.                                                                               // 376
        var options = args[2] = _.clone(args[2]) || {};                                                // 377
        if (options && typeof options !== "function" && options.upsert) {                              // 378
          // set `insertedId` if absent.  `insertedId` is a Meteor extension.                          // 379
          if (options.insertedId) {                                                                    // 380
            if (!(typeof options.insertedId === 'string'                                               // 381
                  || options.insertedId instanceof Meteor.Collection.ObjectID))                        // 382
              throw new Error("insertedId must be string or ObjectID");                                // 383
          } else {                                                                                     // 384
            options.insertedId = self._makeNewID();                                                    // 385
          }                                                                                            // 386
        }                                                                                              // 387
      }                                                                                                // 388
    }                                                                                                  // 389
                                                                                                       // 390
    // On inserts, always return the id that we generated; on all other                                // 391
    // operations, just return the result from the collection.                                         // 392
    var chooseReturnValueFromCollectionResult = function (result) {                                    // 393
      if (name === "insert")                                                                           // 394
        return insertId;                                                                               // 395
      else                                                                                             // 396
        return result;                                                                                 // 397
    };                                                                                                 // 398
                                                                                                       // 399
    var wrappedCallback;                                                                               // 400
    if (callback) {                                                                                    // 401
      wrappedCallback = function (error, result) {                                                     // 402
        callback(error, ! error && chooseReturnValueFromCollectionResult(result));                     // 403
      };                                                                                               // 404
    }                                                                                                  // 405
                                                                                                       // 406
    if (self._connection && self._connection !== Meteor.server) {                                      // 407
      // just remote to another endpoint, propagate return value or                                    // 408
      // exception.                                                                                    // 409
                                                                                                       // 410
      var enclosing = DDP._CurrentInvocation.get();                                                    // 411
      var alreadyInSimulation = enclosing && enclosing.isSimulation;                                   // 412
                                                                                                       // 413
      if (Meteor.isClient && !wrappedCallback && ! alreadyInSimulation) {                              // 414
        // Client can't block, so it can't report errors by exception,                                 // 415
        // only by callback. If they forget the callback, give them a                                  // 416
        // default one that logs the error, so they aren't totally                                     // 417
        // baffled if their writes don't work because their database is                                // 418
        // down.                                                                                       // 419
        // Don't give a default callback in simulation, because inside stubs we                        // 420
        // want to return the results from the local collection immediately and                        // 421
        // not force a callback.                                                                       // 422
        wrappedCallback = function (err) {                                                             // 423
          if (err)                                                                                     // 424
            Meteor._debug(name + " failed: " + (err.reason || err.stack));                             // 425
        };                                                                                             // 426
      }                                                                                                // 427
                                                                                                       // 428
      if (!alreadyInSimulation && name !== "insert") {                                                 // 429
        // If we're about to actually send an RPC, we should throw an error if                         // 430
        // this is a non-ID selector, because the mutation methods only allow                          // 431
        // single-ID selectors. (If we don't throw here, we'll see flicker.)                           // 432
        throwIfSelectorIsNotId(args[0], name);                                                         // 433
      }                                                                                                // 434
                                                                                                       // 435
      ret = chooseReturnValueFromCollectionResult(                                                     // 436
        self._connection.apply(self._prefix + name, args, wrappedCallback)                             // 437
      );                                                                                               // 438
                                                                                                       // 439
    } else {                                                                                           // 440
      // it's my collection.  descend into the collection object                                       // 441
      // and propagate any exception.                                                                  // 442
      args.push(wrappedCallback);                                                                      // 443
      try {                                                                                            // 444
        // If the user provided a callback and the collection implements this                          // 445
        // operation asynchronously, then queryRet will be undefined, and the                          // 446
        // result will be returned through the callback instead.                                       // 447
        var queryRet = self._collection[name].apply(self._collection, args);                           // 448
        ret = chooseReturnValueFromCollectionResult(queryRet);                                         // 449
      } catch (e) {                                                                                    // 450
        if (callback) {                                                                                // 451
          callback(e);                                                                                 // 452
          return null;                                                                                 // 453
        }                                                                                              // 454
        throw e;                                                                                       // 455
      }                                                                                                // 456
    }                                                                                                  // 457
                                                                                                       // 458
    // both sync and async, unless we threw an exception, return ret                                   // 459
    // (new document ID for insert, num affected for update/remove, object with                        // 460
    // numberAffected and maybe insertedId for upsert).                                                // 461
    return ret;                                                                                        // 462
  };                                                                                                   // 463
});                                                                                                    // 464
                                                                                                       // 465
Meteor.Collection.prototype.upsert = function (selector, modifier,                                     // 466
                                               options, callback) {                                    // 467
  var self = this;                                                                                     // 468
  if (! callback && typeof options === "function") {                                                   // 469
    callback = options;                                                                                // 470
    options = {};                                                                                      // 471
  }                                                                                                    // 472
  return self.update(selector, modifier,                                                               // 473
              _.extend({}, options, { _returnObject: true, upsert: true }),                            // 474
              callback);                                                                               // 475
};                                                                                                     // 476
                                                                                                       // 477
// We'll actually design an index API later. For now, we just pass through to                          // 478
// Mongo's, but make it synchronous.                                                                   // 479
Meteor.Collection.prototype._ensureIndex = function (index, options) {                                 // 480
  var self = this;                                                                                     // 481
  if (!self._collection._ensureIndex)                                                                  // 482
    throw new Error("Can only call _ensureIndex on server collections");                               // 483
  self._collection._ensureIndex(index, options);                                                       // 484
};                                                                                                     // 485
Meteor.Collection.prototype._dropIndex = function (index) {                                            // 486
  var self = this;                                                                                     // 487
  if (!self._collection._dropIndex)                                                                    // 488
    throw new Error("Can only call _dropIndex on server collections");                                 // 489
  self._collection._dropIndex(index);                                                                  // 490
};                                                                                                     // 491
Meteor.Collection.prototype._createCappedCollection = function (byteSize) {                            // 492
  var self = this;                                                                                     // 493
  if (!self._collection._createCappedCollection)                                                       // 494
    throw new Error("Can only call _createCappedCollection on server collections");                    // 495
  self._collection._createCappedCollection(byteSize);                                                  // 496
};                                                                                                     // 497
                                                                                                       // 498
Meteor.Collection.ObjectID = LocalCollection._ObjectID;                                                // 499
                                                                                                       // 500
///                                                                                                    // 501
/// Remote methods and access control.                                                                 // 502
///                                                                                                    // 503
                                                                                                       // 504
// Restrict default mutators on collection. allow() and deny() take the                                // 505
// same options:                                                                                       // 506
//                                                                                                     // 507
// options.insert {Function(userId, doc)}                                                              // 508
//   return true to allow/deny adding this document                                                    // 509
//                                                                                                     // 510
// options.update {Function(userId, docs, fields, modifier)}                                           // 511
//   return true to allow/deny updating these documents.                                               // 512
//   `fields` is passed as an array of fields that are to be modified                                  // 513
//                                                                                                     // 514
// options.remove {Function(userId, docs)}                                                             // 515
//   return true to allow/deny removing these documents                                                // 516
//                                                                                                     // 517
// options.fetch {Array}                                                                               // 518
//   Fields to fetch for these validators. If any call to allow or deny                                // 519
//   does not have this option then all fields are loaded.                                             // 520
//                                                                                                     // 521
// allow and deny can be called multiple times. The validators are                                     // 522
// evaluated as follows:                                                                               // 523
// - If neither deny() nor allow() has been called on the collection,                                  // 524
//   then the request is allowed if and only if the "insecure" smart                                   // 525
//   package is in use.                                                                                // 526
// - Otherwise, if any deny() function returns true, the request is denied.                            // 527
// - Otherwise, if any allow() function returns true, the request is allowed.                          // 528
// - Otherwise, the request is denied.                                                                 // 529
//                                                                                                     // 530
// Meteor may call your deny() and allow() functions in any order, and may not                         // 531
// call all of them if it is able to make a decision without calling them all                          // 532
// (so don't include side effects).                                                                    // 533
                                                                                                       // 534
(function () {                                                                                         // 535
  var addValidator = function(allowOrDeny, options) {                                                  // 536
    // validate keys                                                                                   // 537
    var VALID_KEYS = ['insert', 'update', 'remove', 'fetch', 'transform'];                             // 538
    _.each(_.keys(options), function (key) {                                                           // 539
      if (!_.contains(VALID_KEYS, key))                                                                // 540
        throw new Error(allowOrDeny + ": Invalid key: " + key);                                        // 541
    });                                                                                                // 542
                                                                                                       // 543
    var self = this;                                                                                   // 544
    self._restricted = true;                                                                           // 545
                                                                                                       // 546
    _.each(['insert', 'update', 'remove'], function (name) {                                           // 547
      if (options[name]) {                                                                             // 548
        if (!(options[name] instanceof Function)) {                                                    // 549
          throw new Error(allowOrDeny + ": Value for `" + name + "` must be a function");              // 550
        }                                                                                              // 551
        if (self._transform)                                                                           // 552
          options[name].transform = self._transform;                                                   // 553
        if (options.transform)                                                                         // 554
          options[name].transform = Deps._makeNonreactive(options.transform);                          // 555
        self._validators[name][allowOrDeny].push(options[name]);                                       // 556
      }                                                                                                // 557
    });                                                                                                // 558
                                                                                                       // 559
    // Only update the fetch fields if we're passed things that affect                                 // 560
    // fetching. This way allow({}) and allow({insert: f}) don't result in                             // 561
    // setting fetchAllFields                                                                          // 562
    if (options.update || options.remove || options.fetch) {                                           // 563
      if (options.fetch && !(options.fetch instanceof Array)) {                                        // 564
        throw new Error(allowOrDeny + ": Value for `fetch` must be an array");                         // 565
      }                                                                                                // 566
      self._updateFetch(options.fetch);                                                                // 567
    }                                                                                                  // 568
  };                                                                                                   // 569
                                                                                                       // 570
  Meteor.Collection.prototype.allow = function(options) {                                              // 571
    addValidator.call(this, 'allow', options);                                                         // 572
  };                                                                                                   // 573
  Meteor.Collection.prototype.deny = function(options) {                                               // 574
    addValidator.call(this, 'deny', options);                                                          // 575
  };                                                                                                   // 576
})();                                                                                                  // 577
                                                                                                       // 578
                                                                                                       // 579
Meteor.Collection.prototype._defineMutationMethods = function() {                                      // 580
  var self = this;                                                                                     // 581
                                                                                                       // 582
  // set to true once we call any allow or deny methods. If true, use                                  // 583
  // allow/deny semantics. If false, use insecure mode semantics.                                      // 584
  self._restricted = false;                                                                            // 585
                                                                                                       // 586
  // Insecure mode (default to allowing writes). Defaults to 'undefined' which                         // 587
  // means insecure iff the insecure package is loaded. This property can be                           // 588
  // overriden by tests or packages wishing to change insecure mode behavior of                        // 589
  // their collections.                                                                                // 590
  self._insecure = undefined;                                                                          // 591
                                                                                                       // 592
  self._validators = {                                                                                 // 593
    insert: {allow: [], deny: []},                                                                     // 594
    update: {allow: [], deny: []},                                                                     // 595
    remove: {allow: [], deny: []},                                                                     // 596
    upsert: {allow: [], deny: []}, // dummy arrays; can't set these!                                   // 597
    fetch: [],                                                                                         // 598
    fetchAllFields: false                                                                              // 599
  };                                                                                                   // 600
                                                                                                       // 601
  if (!self._name)                                                                                     // 602
    return; // anonymous collection                                                                    // 603
                                                                                                       // 604
  // XXX Think about method namespacing. Maybe methods should be                                       // 605
  // "Meteor:Mongo:insert/NAME"?                                                                       // 606
  self._prefix = '/' + self._name + '/';                                                               // 607
                                                                                                       // 608
  // mutation methods                                                                                  // 609
  if (self._connection) {                                                                              // 610
    var m = {};                                                                                        // 611
                                                                                                       // 612
    _.each(['insert', 'update', 'remove'], function (method) {                                         // 613
      m[self._prefix + method] = function (/* ... */) {                                                // 614
        // All the methods do their own validation, instead of using check().                          // 615
        check(arguments, [Match.Any]);                                                                 // 616
        try {                                                                                          // 617
          if (this.isSimulation) {                                                                     // 618
                                                                                                       // 619
            // In a client simulation, you can do any mutation (even with a                            // 620
            // complex selector).                                                                      // 621
            return self._collection[method].apply(                                                     // 622
              self._collection, _.toArray(arguments));                                                 // 623
          }                                                                                            // 624
                                                                                                       // 625
          // This is the server receiving a method call from the client.                               // 626
                                                                                                       // 627
          // We don't allow arbitrary selectors in mutations from the client: only                     // 628
          // single-ID selectors.                                                                      // 629
          if (method !== 'insert')                                                                     // 630
            throwIfSelectorIsNotId(arguments[0], method);                                              // 631
                                                                                                       // 632
          if (self._restricted) {                                                                      // 633
            // short circuit if there is no way it will pass.                                          // 634
            if (self._validators[method].allow.length === 0) {                                         // 635
              throw new Meteor.Error(                                                                  // 636
                403, "Access denied. No allow validators set on restricted " +                         // 637
                  "collection for method '" + method + "'.");                                          // 638
            }                                                                                          // 639
                                                                                                       // 640
            var validatedMethodName =                                                                  // 641
                  '_validated' + method.charAt(0).toUpperCase() + method.slice(1);                     // 642
            var argsWithUserId = [this.userId].concat(_.toArray(arguments));                           // 643
            return self[validatedMethodName].apply(self, argsWithUserId);                              // 644
          } else if (self._isInsecure()) {                                                             // 645
            // In insecure mode, allow any mutation (with a simple selector).                          // 646
            return self._collection[method].apply(self._collection,                                    // 647
                                                  _.toArray(arguments));                               // 648
          } else {                                                                                     // 649
            // In secure mode, if we haven't called allow or deny, then nothing                        // 650
            // is permitted.                                                                           // 651
            throw new Meteor.Error(403, "Access denied");                                              // 652
          }                                                                                            // 653
        } catch (e) {                                                                                  // 654
          if (e.name === 'MongoError' || e.name === 'MinimongoError') {                                // 655
            throw new Meteor.Error(409, e.toString());                                                 // 656
          } else {                                                                                     // 657
            throw e;                                                                                   // 658
          }                                                                                            // 659
        }                                                                                              // 660
      };                                                                                               // 661
    });                                                                                                // 662
    // Minimongo on the server gets no stubs; instead, by default                                      // 663
    // it wait()s until its result is ready, yielding.                                                 // 664
    // This matches the behavior of macromongo on the server better.                                   // 665
    if (Meteor.isClient || self._connection === Meteor.server)                                         // 666
      self._connection.methods(m);                                                                     // 667
  }                                                                                                    // 668
};                                                                                                     // 669
                                                                                                       // 670
                                                                                                       // 671
Meteor.Collection.prototype._updateFetch = function (fields) {                                         // 672
  var self = this;                                                                                     // 673
                                                                                                       // 674
  if (!self._validators.fetchAllFields) {                                                              // 675
    if (fields) {                                                                                      // 676
      self._validators.fetch = _.union(self._validators.fetch, fields);                                // 677
    } else {                                                                                           // 678
      self._validators.fetchAllFields = true;                                                          // 679
      // clear fetch just to make sure we don't accidentally read it                                   // 680
      self._validators.fetch = null;                                                                   // 681
    }                                                                                                  // 682
  }                                                                                                    // 683
};                                                                                                     // 684
                                                                                                       // 685
Meteor.Collection.prototype._isInsecure = function () {                                                // 686
  var self = this;                                                                                     // 687
  if (self._insecure === undefined)                                                                    // 688
    return !!Package.insecure;                                                                         // 689
  return self._insecure;                                                                               // 690
};                                                                                                     // 691
                                                                                                       // 692
var docToValidate = function (validator, doc) {                                                        // 693
  var ret = doc;                                                                                       // 694
  if (validator.transform)                                                                             // 695
    ret = validator.transform(EJSON.clone(doc));                                                       // 696
  return ret;                                                                                          // 697
};                                                                                                     // 698
                                                                                                       // 699
Meteor.Collection.prototype._validatedInsert = function(userId, doc) {                                 // 700
  var self = this;                                                                                     // 701
                                                                                                       // 702
  // call user validators.                                                                             // 703
  // Any deny returns true means denied.                                                               // 704
  if (_.any(self._validators.insert.deny, function(validator) {                                        // 705
    return validator(userId, docToValidate(validator, doc));                                           // 706
  })) {                                                                                                // 707
    throw new Meteor.Error(403, "Access denied");                                                      // 708
  }                                                                                                    // 709
  // Any allow returns true means proceed. Throw error if they all fail.                               // 710
  if (_.all(self._validators.insert.allow, function(validator) {                                       // 711
    return !validator(userId, docToValidate(validator, doc));                                          // 712
  })) {                                                                                                // 713
    throw new Meteor.Error(403, "Access denied");                                                      // 714
  }                                                                                                    // 715
                                                                                                       // 716
  self._collection.insert.call(self._collection, doc);                                                 // 717
};                                                                                                     // 718
                                                                                                       // 719
var transformDoc = function (validator, doc) {                                                         // 720
  if (validator.transform)                                                                             // 721
    return validator.transform(doc);                                                                   // 722
  return doc;                                                                                          // 723
};                                                                                                     // 724
                                                                                                       // 725
// Simulate a mongo `update` operation while validating that the access                                // 726
// control rules set by calls to `allow/deny` are satisfied. If all                                    // 727
// pass, rewrite the mongo operation to use $in to set the list of                                     // 728
// document ids to change ##ValidatedChange                                                            // 729
Meteor.Collection.prototype._validatedUpdate = function(                                               // 730
    userId, selector, mutator, options) {                                                              // 731
  var self = this;                                                                                     // 732
                                                                                                       // 733
  options = options || {};                                                                             // 734
                                                                                                       // 735
  if (!LocalCollection._selectorIsIdPerhapsAsObject(selector))                                         // 736
    throw new Error("validated update should be of a single ID");                                      // 737
                                                                                                       // 738
  // We don't support upserts because they don't fit nicely into allow/deny                            // 739
  // rules.                                                                                            // 740
  if (options.upsert)                                                                                  // 741
    throw new Meteor.Error(403, "Access denied. Upserts not " +                                        // 742
                           "allowed in a restricted collection.");                                     // 743
                                                                                                       // 744
  // compute modified fields                                                                           // 745
  var fields = [];                                                                                     // 746
  _.each(mutator, function (params, op) {                                                              // 747
    if (op.charAt(0) !== '$') {                                                                        // 748
      throw new Meteor.Error(                                                                          // 749
        403, "Access denied. In a restricted collection you can only update documents, not replace them. Use a Mongo update operator, such as '$set'.");
    } else if (!_.has(ALLOWED_UPDATE_OPERATIONS, op)) {                                                // 751
      throw new Meteor.Error(                                                                          // 752
        403, "Access denied. Operator " + op + " not allowed in a restricted collection.");            // 753
    } else {                                                                                           // 754
      _.each(_.keys(params), function (field) {                                                        // 755
        // treat dotted fields as if they are replacing their                                          // 756
        // top-level part                                                                              // 757
        if (field.indexOf('.') !== -1)                                                                 // 758
          field = field.substring(0, field.indexOf('.'));                                              // 759
                                                                                                       // 760
        // record the field we are trying to change                                                    // 761
        if (!_.contains(fields, field))                                                                // 762
          fields.push(field);                                                                          // 763
      });                                                                                              // 764
    }                                                                                                  // 765
  });                                                                                                  // 766
                                                                                                       // 767
  var findOptions = {transform: null};                                                                 // 768
  if (!self._validators.fetchAllFields) {                                                              // 769
    findOptions.fields = {};                                                                           // 770
    _.each(self._validators.fetch, function(fieldName) {                                               // 771
      findOptions.fields[fieldName] = 1;                                                               // 772
    });                                                                                                // 773
  }                                                                                                    // 774
                                                                                                       // 775
  var doc = self._collection.findOne(selector, findOptions);                                           // 776
  if (!doc)  // none satisfied!                                                                        // 777
    return;                                                                                            // 778
                                                                                                       // 779
  var factoriedDoc;                                                                                    // 780
                                                                                                       // 781
  // call user validators.                                                                             // 782
  // Any deny returns true means denied.                                                               // 783
  if (_.any(self._validators.update.deny, function(validator) {                                        // 784
    if (!factoriedDoc)                                                                                 // 785
      factoriedDoc = transformDoc(validator, doc);                                                     // 786
    return validator(userId,                                                                           // 787
                     factoriedDoc,                                                                     // 788
                     fields,                                                                           // 789
                     mutator);                                                                         // 790
  })) {                                                                                                // 791
    throw new Meteor.Error(403, "Access denied");                                                      // 792
  }                                                                                                    // 793
  // Any allow returns true means proceed. Throw error if they all fail.                               // 794
  if (_.all(self._validators.update.allow, function(validator) {                                       // 795
    if (!factoriedDoc)                                                                                 // 796
      factoriedDoc = transformDoc(validator, doc);                                                     // 797
    return !validator(userId,                                                                          // 798
                      factoriedDoc,                                                                    // 799
                      fields,                                                                          // 800
                      mutator);                                                                        // 801
  })) {                                                                                                // 802
    throw new Meteor.Error(403, "Access denied");                                                      // 803
  }                                                                                                    // 804
                                                                                                       // 805
  // Back when we supported arbitrary client-provided selectors, we actually                           // 806
  // rewrote the selector to include an _id clause before passing to Mongo to                          // 807
  // avoid races, but since selector is guaranteed to already just be an ID, we                        // 808
  // don't have to any more.                                                                           // 809
                                                                                                       // 810
  self._collection.update.call(                                                                        // 811
    self._collection, selector, mutator, options);                                                     // 812
};                                                                                                     // 813
                                                                                                       // 814
// Only allow these operations in validated updates. Specifically                                      // 815
// whitelist operations, rather than blacklist, so new complex                                         // 816
// operations that are added aren't automatically allowed. A complex                                   // 817
// operation is one that does more than just modify its target                                         // 818
// field. For now this contains all update operations except '$rename'.                                // 819
// http://docs.mongodb.org/manual/reference/operators/#update                                          // 820
var ALLOWED_UPDATE_OPERATIONS = {                                                                      // 821
  $inc:1, $set:1, $unset:1, $addToSet:1, $pop:1, $pullAll:1, $pull:1,                                  // 822
  $pushAll:1, $push:1, $bit:1                                                                          // 823
};                                                                                                     // 824
                                                                                                       // 825
// Simulate a mongo `remove` operation while validating access control                                 // 826
// rules. See #ValidatedChange                                                                         // 827
Meteor.Collection.prototype._validatedRemove = function(userId, selector) {                            // 828
  var self = this;                                                                                     // 829
                                                                                                       // 830
  var findOptions = {transform: null};                                                                 // 831
  if (!self._validators.fetchAllFields) {                                                              // 832
    findOptions.fields = {};                                                                           // 833
    _.each(self._validators.fetch, function(fieldName) {                                               // 834
      findOptions.fields[fieldName] = 1;                                                               // 835
    });                                                                                                // 836
  }                                                                                                    // 837
                                                                                                       // 838
  var doc = self._collection.findOne(selector, findOptions);                                           // 839
  if (!doc)                                                                                            // 840
    return;                                                                                            // 841
                                                                                                       // 842
  // call user validators.                                                                             // 843
  // Any deny returns true means denied.                                                               // 844
  if (_.any(self._validators.remove.deny, function(validator) {                                        // 845
    return validator(userId, transformDoc(validator, doc));                                            // 846
  })) {                                                                                                // 847
    throw new Meteor.Error(403, "Access denied");                                                      // 848
  }                                                                                                    // 849
  // Any allow returns true means proceed. Throw error if they all fail.                               // 850
  if (_.all(self._validators.remove.allow, function(validator) {                                       // 851
    return !validator(userId, transformDoc(validator, doc));                                           // 852
  })) {                                                                                                // 853
    throw new Meteor.Error(403, "Access denied");                                                      // 854
  }                                                                                                    // 855
                                                                                                       // 856
  // Back when we supported arbitrary client-provided selectors, we actually                           // 857
  // rewrote the selector to {_id: {$in: [ids that we found]}} before passing to                       // 858
  // Mongo to avoid races, but since selector is guaranteed to already just be                         // 859
  // an ID, we don't have to any more.                                                                 // 860
                                                                                                       // 861
  self._collection.remove.call(self._collection, selector);                                            // 862
};                                                                                                     // 863
                                                                                                       // 864
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['mongo-livedata'] = {
  MongoInternals: MongoInternals
};

})();
