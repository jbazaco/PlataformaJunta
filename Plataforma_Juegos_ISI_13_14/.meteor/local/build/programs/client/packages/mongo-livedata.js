//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
//                                                                      //
// If you are using Chrome, open the Developer Tools and click the gear //
// icon in its lower right corner. In the General Settings panel, turn  //
// on 'Enable source maps'.                                             //
//                                                                      //
// If you are using Firefox 23, go to `about:config` and set the        //
// `devtools.debugger.source-maps-enabled` preference to true.          //
// (The preference should be on by default in Firefox 24; versions      //
// older than 23 do not support source maps.)                           //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var JSON = Package.json.JSON;
var _ = Package.underscore._;
var LocalCollection = Package.minimongo.LocalCollection;
var Log = Package.logging.Log;
var DDP = Package.livedata.DDP;
var Deps = Package.deps.Deps;
var check = Package.check.check;
var Match = Package.check.Match;

/* Package-scope variables */
var LocalCollectionDriver;

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
Package['mongo-livedata'] = {};

})();

//# sourceMappingURL=2f66d8591aa3225badaf5a98bfba28287bff3a3d.map
