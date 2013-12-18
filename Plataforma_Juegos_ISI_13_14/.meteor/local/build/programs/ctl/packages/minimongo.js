(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var _ = Package.underscore._;
var EJSON = Package.ejson.EJSON;
var OrderedDict = Package['ordered-dict'].OrderedDict;
var Deps = Package.deps.Deps;
var Random = Package.random.Random;
var GeoJSON = Package['geojson-utils'].GeoJSON;

/* Package-scope variables */
var LocalCollection;

(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/minimongo/minimongo.js                                                                    //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
// XXX type checking on selectors (graceful error if malformed)                                       // 1
                                                                                                      // 2
// LocalCollection: a set of documents that supports queries and modifiers.                           // 3
                                                                                                      // 4
// Cursor: a specification for a particular subset of documents, w/                                   // 5
// a defined order, limit, and offset.  creating a Cursor with LocalCollection.find(),                // 6
                                                                                                      // 7
// LiveResultsSet: the return value of a live query.                                                  // 8
                                                                                                      // 9
LocalCollection = function (name) {                                                                   // 10
  this.name = name;                                                                                   // 11
  this.docs = {}; // _id -> document (also containing id)                                             // 12
                                                                                                      // 13
  this._observeQueue = new Meteor._SynchronousQueue();                                                // 14
                                                                                                      // 15
  this.next_qid = 1; // live query id generator                                                       // 16
                                                                                                      // 17
  // qid -> live query object. keys:                                                                  // 18
  //  ordered: bool. ordered queries have moved callbacks and callbacks                               // 19
  //           take indices.                                                                          // 20
  //  results: array (ordered) or object (unordered) of current results                               // 21
  //  results_snapshot: snapshot of results. null if not paused.                                      // 22
  //  cursor: Cursor object for the query.                                                            // 23
  //  selector_f, sort_f, (callbacks): functions                                                      // 24
  this.queries = {};                                                                                  // 25
                                                                                                      // 26
  // null if not saving originals; a map from id to original document value if                        // 27
  // saving originals. See comments before saveOriginals().                                           // 28
  this._savedOriginals = null;                                                                        // 29
                                                                                                      // 30
  // True when observers are paused and we should not send callbacks.                                 // 31
  this.paused = false;                                                                                // 32
};                                                                                                    // 33
                                                                                                      // 34
                                                                                                      // 35
LocalCollection._applyChanges = function (doc, changeFields) {                                        // 36
  _.each(changeFields, function (value, key) {                                                        // 37
    if (value === undefined)                                                                          // 38
      delete doc[key];                                                                                // 39
    else                                                                                              // 40
      doc[key] = value;                                                                               // 41
  });                                                                                                 // 42
};                                                                                                    // 43
                                                                                                      // 44
var MinimongoError = function (message) {                                                             // 45
  var e = new Error(message);                                                                         // 46
  e.name = "MinimongoError";                                                                          // 47
  return e;                                                                                           // 48
};                                                                                                    // 49
                                                                                                      // 50
                                                                                                      // 51
// options may include sort, skip, limit, reactive                                                    // 52
// sort may be any of these forms:                                                                    // 53
//     {a: 1, b: -1}                                                                                  // 54
//     [["a", "asc"], ["b", "desc"]]                                                                  // 55
//     ["a", ["b", "desc"]]                                                                           // 56
//   (in the first form you're beholden to key enumeration order in                                   // 57
//   your javascript VM)                                                                              // 58
//                                                                                                    // 59
// reactive: if given, and false, don't register with Deps (default                                   // 60
// is true)                                                                                           // 61
//                                                                                                    // 62
// XXX possibly should support retrieving a subset of fields? and                                     // 63
// have it be a hint (ignored on the client, when not copying the                                     // 64
// doc?)                                                                                              // 65
//                                                                                                    // 66
// XXX sort does not yet support subkeys ('a.b') .. fix that!                                         // 67
// XXX add one more sort form: "key"                                                                  // 68
// XXX tests                                                                                          // 69
LocalCollection.prototype.find = function (selector, options) {                                       // 70
  // default syntax for everything is to omit the selector argument.                                  // 71
  // but if selector is explicitly passed in as false or undefined, we                                // 72
  // want a selector that matches nothing.                                                            // 73
  if (arguments.length === 0)                                                                         // 74
    selector = {};                                                                                    // 75
                                                                                                      // 76
  return new LocalCollection.Cursor(this, selector, options);                                         // 77
};                                                                                                    // 78
                                                                                                      // 79
// don't call this ctor directly.  use LocalCollection.find().                                        // 80
LocalCollection.Cursor = function (collection, selector, options) {                                   // 81
  var self = this;                                                                                    // 82
  if (!options) options = {};                                                                         // 83
                                                                                                      // 84
  this.collection = collection;                                                                       // 85
                                                                                                      // 86
  if (LocalCollection._selectorIsId(selector)) {                                                      // 87
    // stash for fast path                                                                            // 88
    self.selector_id = LocalCollection._idStringify(selector);                                        // 89
    self.selector_f = LocalCollection._compileSelector(selector, self);                               // 90
    self.sort_f = undefined;                                                                          // 91
  } else {                                                                                            // 92
    // MongoDB throws different errors on different branching operators                               // 93
    // containing $near                                                                               // 94
    if (isGeoQuerySpecial(selector))                                                                  // 95
      throw new Error("$near can't be inside $or/$and/$nor/$not");                                    // 96
                                                                                                      // 97
    self.selector_id = undefined;                                                                     // 98
    self.selector_f = LocalCollection._compileSelector(selector, self);                               // 99
    self.sort_f = (isGeoQuery(selector) || options.sort) ?                                            // 100
      LocalCollection._compileSort(options.sort || [], self) : null;                                  // 101
  }                                                                                                   // 102
  self.skip = options.skip;                                                                           // 103
  self.limit = options.limit;                                                                         // 104
  self.fields = options.fields;                                                                       // 105
                                                                                                      // 106
  if (self.fields)                                                                                    // 107
    self.projection_f = LocalCollection._compileProjection(self.fields);                              // 108
                                                                                                      // 109
  if (options.transform && typeof Deps !== "undefined")                                               // 110
    self._transform = Deps._makeNonreactive(options.transform);                                       // 111
  else                                                                                                // 112
    self._transform = options.transform;                                                              // 113
                                                                                                      // 114
  // db_objects is a list of the objects that match the cursor. (It's always a                        // 115
  // list, never an object: LocalCollection.Cursor is always ordered.)                                // 116
  self.db_objects = null;                                                                             // 117
  self.cursor_pos = 0;                                                                                // 118
                                                                                                      // 119
  // by default, queries register w/ Deps when it is available.                                       // 120
  if (typeof Deps !== "undefined")                                                                    // 121
    self.reactive = (options.reactive === undefined) ? true : options.reactive;                       // 122
};                                                                                                    // 123
                                                                                                      // 124
LocalCollection.Cursor.prototype.rewind = function () {                                               // 125
  var self = this;                                                                                    // 126
  self.db_objects = null;                                                                             // 127
  self.cursor_pos = 0;                                                                                // 128
};                                                                                                    // 129
                                                                                                      // 130
LocalCollection.prototype.findOne = function (selector, options) {                                    // 131
  if (arguments.length === 0)                                                                         // 132
    selector = {};                                                                                    // 133
                                                                                                      // 134
  // NOTE: by setting limit 1 here, we end up using very inefficient                                  // 135
  // code that recomputes the whole query on each update. The upside is                               // 136
  // that when you reactively depend on a findOne you only get                                        // 137
  // invalidated when the found object changes, not any object in the                                 // 138
  // collection. Most findOne will be by id, which has a fast path, so                                // 139
  // this might not be a big deal. In most cases, invalidation causes                                 // 140
  // the called to re-query anyway, so this should be a net performance                               // 141
  // improvement.                                                                                     // 142
  options = options || {};                                                                            // 143
  options.limit = 1;                                                                                  // 144
                                                                                                      // 145
  return this.find(selector, options).fetch()[0];                                                     // 146
};                                                                                                    // 147
                                                                                                      // 148
LocalCollection.Cursor.prototype.forEach = function (callback, thisArg) {                             // 149
  var self = this;                                                                                    // 150
                                                                                                      // 151
  if (self.db_objects === null)                                                                       // 152
    self.db_objects = self._getRawObjects(true);                                                      // 153
                                                                                                      // 154
  if (self.reactive)                                                                                  // 155
    self._depend({                                                                                    // 156
      addedBefore: true,                                                                              // 157
      removed: true,                                                                                  // 158
      changed: true,                                                                                  // 159
      movedBefore: true});                                                                            // 160
                                                                                                      // 161
  while (self.cursor_pos < self.db_objects.length) {                                                  // 162
    var elt = EJSON.clone(self.db_objects[self.cursor_pos]);                                          // 163
    if (self.projection_f)                                                                            // 164
      elt = self.projection_f(elt);                                                                   // 165
    if (self._transform)                                                                              // 166
      elt = self._transform(elt);                                                                     // 167
    callback.call(thisArg, elt, self.cursor_pos, self);                                               // 168
    ++self.cursor_pos;                                                                                // 169
  }                                                                                                   // 170
};                                                                                                    // 171
                                                                                                      // 172
LocalCollection.Cursor.prototype.getTransform = function () {                                         // 173
  var self = this;                                                                                    // 174
  return self._transform;                                                                             // 175
};                                                                                                    // 176
                                                                                                      // 177
LocalCollection.Cursor.prototype.map = function (callback, thisArg) {                                 // 178
  var self = this;                                                                                    // 179
  var res = [];                                                                                       // 180
  self.forEach(function (doc, index) {                                                                // 181
    res.push(callback.call(thisArg, doc, index, self));                                               // 182
  });                                                                                                 // 183
  return res;                                                                                         // 184
};                                                                                                    // 185
                                                                                                      // 186
LocalCollection.Cursor.prototype.fetch = function () {                                                // 187
  var self = this;                                                                                    // 188
  var res = [];                                                                                       // 189
  self.forEach(function (doc) {                                                                       // 190
    res.push(doc);                                                                                    // 191
  });                                                                                                 // 192
  return res;                                                                                         // 193
};                                                                                                    // 194
                                                                                                      // 195
LocalCollection.Cursor.prototype.count = function () {                                                // 196
  var self = this;                                                                                    // 197
                                                                                                      // 198
  if (self.reactive)                                                                                  // 199
    self._depend({added: true, removed: true},                                                        // 200
                 true /* allow the observe to be unordered */);                                       // 201
                                                                                                      // 202
  if (self.db_objects === null)                                                                       // 203
    self.db_objects = self._getRawObjects(true);                                                      // 204
                                                                                                      // 205
  return self.db_objects.length;                                                                      // 206
};                                                                                                    // 207
                                                                                                      // 208
LocalCollection.Cursor.prototype._publishCursor = function (sub) {                                    // 209
  var self = this;                                                                                    // 210
  if (! self.collection.name)                                                                         // 211
    throw new Error("Can't publish a cursor from a collection without a name.");                      // 212
  var collection = self.collection.name;                                                              // 213
                                                                                                      // 214
  // XXX minimongo should not depend on mongo-livedata!                                               // 215
  return Meteor.Collection._publishCursor(self, sub, collection);                                     // 216
};                                                                                                    // 217
                                                                                                      // 218
LocalCollection._isOrderedChanges = function (callbacks) {                                            // 219
  if (callbacks.added && callbacks.addedBefore)                                                       // 220
    throw new Error("Please specify only one of added() and addedBefore()");                          // 221
  return typeof callbacks.addedBefore == 'function' ||                                                // 222
    typeof callbacks.movedBefore === 'function';                                                      // 223
};                                                                                                    // 224
                                                                                                      // 225
// the handle that comes back from observe.                                                           // 226
LocalCollection.LiveResultsSet = function () {};                                                      // 227
                                                                                                      // 228
// options to contain:                                                                                // 229
//  * callbacks for observe():                                                                        // 230
//    - addedAt (document, atIndex)                                                                   // 231
//    - added (document)                                                                              // 232
//    - changedAt (newDocument, oldDocument, atIndex)                                                 // 233
//    - changed (newDocument, oldDocument)                                                            // 234
//    - removedAt (document, atIndex)                                                                 // 235
//    - removed (document)                                                                            // 236
//    - movedTo (document, oldIndex, newIndex)                                                        // 237
//                                                                                                    // 238
// attributes available on returned query handle:                                                     // 239
//  * stop(): end updates                                                                             // 240
//  * collection: the collection this query is querying                                               // 241
//                                                                                                    // 242
// iff x is a returned query handle, (x instanceof                                                    // 243
// LocalCollection.LiveResultsSet) is true                                                            // 244
//                                                                                                    // 245
// initial results delivered through added callback                                                   // 246
// XXX maybe callbacks should take a list of objects, to expose transactions?                         // 247
// XXX maybe support field limiting (to limit what you're notified on)                                // 248
                                                                                                      // 249
_.extend(LocalCollection.Cursor.prototype, {                                                          // 250
  observe: function (options) {                                                                       // 251
    var self = this;                                                                                  // 252
    return LocalCollection._observeFromObserveChanges(self, options);                                 // 253
  },                                                                                                  // 254
  observeChanges: function (options) {                                                                // 255
    var self = this;                                                                                  // 256
                                                                                                      // 257
    var ordered = LocalCollection._isOrderedChanges(options);                                         // 258
                                                                                                      // 259
    if (!options._allow_unordered && !ordered && (self.skip || self.limit))                           // 260
      throw new Error("must use ordered observe with skip or limit");                                 // 261
                                                                                                      // 262
    // XXX merge this object w/ "this" Cursor.  they're the same.                                     // 263
    var query = {                                                                                     // 264
      selector_f: self.selector_f, // not fast pathed                                                 // 265
      sort_f: ordered && self.sort_f,                                                                 // 266
      results_snapshot: null,                                                                         // 267
      ordered: ordered,                                                                               // 268
      cursor: self,                                                                                   // 269
      observeChanges: options.observeChanges,                                                         // 270
      fields: self.fields,                                                                            // 271
      projection_f: self.projection_f                                                                 // 272
    };                                                                                                // 273
    var qid;                                                                                          // 274
                                                                                                      // 275
    // Non-reactive queries call added[Before] and then never call anything                           // 276
    // else.                                                                                          // 277
    if (self.reactive) {                                                                              // 278
      qid = self.collection.next_qid++;                                                               // 279
      self.collection.queries[qid] = query;                                                           // 280
    }                                                                                                 // 281
    query.results = self._getRawObjects(ordered);                                                     // 282
    if (self.collection.paused)                                                                       // 283
      query.results_snapshot = (ordered ? [] : {});                                                   // 284
                                                                                                      // 285
    // wrap callbacks we were passed. callbacks only fire when not paused and                         // 286
    // are never undefined (except that query.moved is undefined for unordered                        // 287
    // callbacks).                                                                                    // 288
    // Filters out blacklisted fields according to cursor's projection.                               // 289
    // XXX wrong place for this?                                                                      // 290
                                                                                                      // 291
    // furthermore, callbacks enqueue until the operation we're working on is                         // 292
    // done.                                                                                          // 293
    var wrapCallback = function (f, fieldsIndex, ignoreEmptyFields) {                                 // 294
      if (!f)                                                                                         // 295
        return function () {};                                                                        // 296
      return function (/*args*/) {                                                                    // 297
        var context = this;                                                                           // 298
        var args = arguments;                                                                         // 299
                                                                                                      // 300
        if (fieldsIndex !== undefined && self.projection_f) {                                         // 301
          args[fieldsIndex] = self.projection_f(args[fieldsIndex]);                                   // 302
          if (ignoreEmptyFields && _.isEmpty(args[fieldsIndex]))                                      // 303
            return;                                                                                   // 304
        }                                                                                             // 305
                                                                                                      // 306
        if (!self.collection.paused) {                                                                // 307
          self.collection._observeQueue.queueTask(function () {                                       // 308
            f.apply(context, args);                                                                   // 309
          });                                                                                         // 310
        }                                                                                             // 311
      };                                                                                              // 312
    };                                                                                                // 313
    query.added = wrapCallback(options.added, 1);                                                     // 314
    query.changed = wrapCallback(options.changed, 1, true);                                           // 315
    query.removed = wrapCallback(options.removed);                                                    // 316
    if (ordered) {                                                                                    // 317
      query.moved = wrapCallback(options.moved);                                                      // 318
      query.addedBefore = wrapCallback(options.addedBefore, 1);                                       // 319
      query.movedBefore = wrapCallback(options.movedBefore);                                          // 320
    }                                                                                                 // 321
                                                                                                      // 322
    if (!options._suppress_initial && !self.collection.paused) {                                      // 323
      _.each(query.results, function (doc, i) {                                                       // 324
        var fields = EJSON.clone(doc);                                                                // 325
                                                                                                      // 326
        delete fields._id;                                                                            // 327
        if (ordered)                                                                                  // 328
          query.addedBefore(doc._id, fields, null);                                                   // 329
        query.added(doc._id, fields);                                                                 // 330
      });                                                                                             // 331
    }                                                                                                 // 332
                                                                                                      // 333
    var handle = new LocalCollection.LiveResultsSet;                                                  // 334
    _.extend(handle, {                                                                                // 335
      collection: self.collection,                                                                    // 336
      stop: function () {                                                                             // 337
        if (self.reactive)                                                                            // 338
          delete self.collection.queries[qid];                                                        // 339
      }                                                                                               // 340
    });                                                                                               // 341
                                                                                                      // 342
    if (self.reactive && Deps.active) {                                                               // 343
      // XXX in many cases, the same observe will be recreated when                                   // 344
      // the current autorun is rerun.  we could save work by                                         // 345
      // letting it linger across rerun and potentially get                                           // 346
      // repurposed if the same observe is performed, using logic                                     // 347
      // similar to that of Meteor.subscribe.                                                         // 348
      Deps.onInvalidate(function () {                                                                 // 349
        handle.stop();                                                                                // 350
      });                                                                                             // 351
    }                                                                                                 // 352
    // run the observe callbacks resulting from the initial contents                                  // 353
    // before we leave the observe.                                                                   // 354
    self.collection._observeQueue.drain();                                                            // 355
                                                                                                      // 356
    return handle;                                                                                    // 357
  }                                                                                                   // 358
});                                                                                                   // 359
                                                                                                      // 360
// Returns a collection of matching objects, but doesn't deep copy them.                              // 361
//                                                                                                    // 362
// If ordered is set, returns a sorted array, respecting sort_f, skip, and limit                      // 363
// properties of the query.  if sort_f is falsey, no sort -- you get the natural                      // 364
// order.                                                                                             // 365
//                                                                                                    // 366
// If ordered is not set, returns an object mapping from ID to doc (sort_f, skip                      // 367
// and limit should not be set).                                                                      // 368
LocalCollection.Cursor.prototype._getRawObjects = function (ordered) {                                // 369
  var self = this;                                                                                    // 370
                                                                                                      // 371
  var results = ordered ? [] : {};                                                                    // 372
                                                                                                      // 373
  // fast path for single ID value                                                                    // 374
  if (self.selector_id) {                                                                             // 375
    // If you have non-zero skip and ask for a single id, you get                                     // 376
    // nothing. This is so it matches the behavior of the '{_id: foo}'                                // 377
    // path.                                                                                          // 378
    if (self.skip)                                                                                    // 379
      return results;                                                                                 // 380
                                                                                                      // 381
    if (_.has(self.collection.docs, self.selector_id)) {                                              // 382
      var selectedDoc = self.collection.docs[self.selector_id];                                       // 383
      if (ordered)                                                                                    // 384
        results.push(selectedDoc);                                                                    // 385
      else                                                                                            // 386
        results[self.selector_id] = selectedDoc;                                                      // 387
    }                                                                                                 // 388
    return results;                                                                                   // 389
  }                                                                                                   // 390
                                                                                                      // 391
  // slow path for arbitrary selector, sort, skip, limit                                              // 392
  for (var id in self.collection.docs) {                                                              // 393
    var doc = self.collection.docs[id];                                                               // 394
    if (self.selector_f(doc)) {                                                                       // 395
      if (ordered)                                                                                    // 396
        results.push(doc);                                                                            // 397
      else                                                                                            // 398
        results[id] = doc;                                                                            // 399
    }                                                                                                 // 400
    // Fast path for limited unsorted queries.                                                        // 401
    if (self.limit && !self.skip && !self.sort_f &&                                                   // 402
        results.length === self.limit)                                                                // 403
      return results;                                                                                 // 404
  }                                                                                                   // 405
                                                                                                      // 406
  if (!ordered)                                                                                       // 407
    return results;                                                                                   // 408
                                                                                                      // 409
  if (self.sort_f)                                                                                    // 410
    results.sort(self.sort_f);                                                                        // 411
                                                                                                      // 412
  var idx_start = self.skip || 0;                                                                     // 413
  var idx_end = self.limit ? (self.limit + idx_start) : results.length;                               // 414
  return results.slice(idx_start, idx_end);                                                           // 415
};                                                                                                    // 416
                                                                                                      // 417
// XXX Maybe we need a version of observe that just calls a callback if                               // 418
// anything changed.                                                                                  // 419
LocalCollection.Cursor.prototype._depend = function (changers, _allow_unordered) {                    // 420
  var self = this;                                                                                    // 421
                                                                                                      // 422
  if (Deps.active) {                                                                                  // 423
    var v = new Deps.Dependency;                                                                      // 424
    v.depend();                                                                                       // 425
    var notifyChange = _.bind(v.changed, v);                                                          // 426
                                                                                                      // 427
    var options = {                                                                                   // 428
      _suppress_initial: true,                                                                        // 429
      _allow_unordered: _allow_unordered                                                              // 430
    };                                                                                                // 431
    _.each(['added', 'changed', 'removed', 'addedBefore', 'movedBefore'],                             // 432
           function (fnName) {                                                                        // 433
             if (changers[fnName])                                                                    // 434
               options[fnName] = notifyChange;                                                        // 435
           });                                                                                        // 436
                                                                                                      // 437
    // observeChanges will stop() when this computation is invalidated                                // 438
    self.observeChanges(options);                                                                     // 439
  }                                                                                                   // 440
};                                                                                                    // 441
                                                                                                      // 442
// XXX enforce rule that field names can't start with '$' or contain '.'                              // 443
// (real mongodb does in fact enforce this)                                                           // 444
// XXX possibly enforce that 'undefined' does not appear (we assume                                   // 445
// this in our handling of null and $exists)                                                          // 446
LocalCollection.prototype.insert = function (doc, callback) {                                         // 447
  var self = this;                                                                                    // 448
  doc = EJSON.clone(doc);                                                                             // 449
                                                                                                      // 450
  if (!_.has(doc, '_id')) {                                                                           // 451
    // if you really want to use ObjectIDs, set this global.                                          // 452
    // Meteor.Collection specifies its own ids and does not use this code.                            // 453
    doc._id = LocalCollection._useOID ? new LocalCollection._ObjectID()                               // 454
                                      : Random.id();                                                  // 455
  }                                                                                                   // 456
  var id = LocalCollection._idStringify(doc._id);                                                     // 457
                                                                                                      // 458
  if (_.has(self.docs, id))                                                                           // 459
    throw MinimongoError("Duplicate _id '" + doc._id + "'");                                          // 460
                                                                                                      // 461
  self._saveOriginal(id, undefined);                                                                  // 462
  self.docs[id] = doc;                                                                                // 463
                                                                                                      // 464
  var queriesToRecompute = [];                                                                        // 465
  // trigger live queries that match                                                                  // 466
  for (var qid in self.queries) {                                                                     // 467
    var query = self.queries[qid];                                                                    // 468
    if (query.selector_f(doc)) {                                                                      // 469
      if (query.cursor.skip || query.cursor.limit)                                                    // 470
        queriesToRecompute.push(qid);                                                                 // 471
      else                                                                                            // 472
        LocalCollection._insertInResults(query, doc);                                                 // 473
    }                                                                                                 // 474
  }                                                                                                   // 475
                                                                                                      // 476
  _.each(queriesToRecompute, function (qid) {                                                         // 477
    if (self.queries[qid])                                                                            // 478
      LocalCollection._recomputeResults(self.queries[qid]);                                           // 479
  });                                                                                                 // 480
  self._observeQueue.drain();                                                                         // 481
                                                                                                      // 482
  // Defer because the caller likely doesn't expect the callback to be run                            // 483
  // immediately.                                                                                     // 484
  if (callback)                                                                                       // 485
    Meteor.defer(function () {                                                                        // 486
      callback(null, doc._id);                                                                        // 487
    });                                                                                               // 488
  return doc._id;                                                                                     // 489
};                                                                                                    // 490
                                                                                                      // 491
LocalCollection.prototype.remove = function (selector, callback) {                                    // 492
  var self = this;                                                                                    // 493
  var remove = [];                                                                                    // 494
                                                                                                      // 495
  var queriesToRecompute = [];                                                                        // 496
  var selector_f = LocalCollection._compileSelector(selector, self);                                  // 497
                                                                                                      // 498
  // Avoid O(n) for "remove a single doc by ID".                                                      // 499
  var specificIds = LocalCollection._idsMatchedBySelector(selector);                                  // 500
  if (specificIds) {                                                                                  // 501
    _.each(specificIds, function (id) {                                                               // 502
      var strId = LocalCollection._idStringify(id);                                                   // 503
      // We still have to run selector_f, in case it's something like                                 // 504
      //   {_id: "X", a: 42}                                                                          // 505
      if (_.has(self.docs, strId) && selector_f(self.docs[strId]))                                    // 506
        remove.push(strId);                                                                           // 507
    });                                                                                               // 508
  } else {                                                                                            // 509
    for (var id in self.docs) {                                                                       // 510
      var doc = self.docs[id];                                                                        // 511
      if (selector_f(doc)) {                                                                          // 512
        remove.push(id);                                                                              // 513
      }                                                                                               // 514
    }                                                                                                 // 515
  }                                                                                                   // 516
                                                                                                      // 517
  var queryRemove = [];                                                                               // 518
  for (var i = 0; i < remove.length; i++) {                                                           // 519
    var removeId = remove[i];                                                                         // 520
    var removeDoc = self.docs[removeId];                                                              // 521
    _.each(self.queries, function (query, qid) {                                                      // 522
      if (query.selector_f(removeDoc)) {                                                              // 523
        if (query.cursor.skip || query.cursor.limit)                                                  // 524
          queriesToRecompute.push(qid);                                                               // 525
        else                                                                                          // 526
          queryRemove.push({qid: qid, doc: removeDoc});                                               // 527
      }                                                                                               // 528
    });                                                                                               // 529
    self._saveOriginal(removeId, removeDoc);                                                          // 530
    delete self.docs[removeId];                                                                       // 531
  }                                                                                                   // 532
                                                                                                      // 533
  // run live query callbacks _after_ we've removed the documents.                                    // 534
  _.each(queryRemove, function (remove) {                                                             // 535
    var query = self.queries[remove.qid];                                                             // 536
    if (query)                                                                                        // 537
      LocalCollection._removeFromResults(query, remove.doc);                                          // 538
  });                                                                                                 // 539
  _.each(queriesToRecompute, function (qid) {                                                         // 540
    var query = self.queries[qid];                                                                    // 541
    if (query)                                                                                        // 542
      LocalCollection._recomputeResults(query);                                                       // 543
  });                                                                                                 // 544
  self._observeQueue.drain();                                                                         // 545
  var result = remove.length;                                                                         // 546
  if (callback)                                                                                       // 547
    Meteor.defer(function () {                                                                        // 548
      callback(null, result);                                                                         // 549
    });                                                                                               // 550
  return result;                                                                                      // 551
};                                                                                                    // 552
                                                                                                      // 553
// XXX atomicity: if multi is true, and one modification fails, do                                    // 554
// we rollback the whole operation, or what?                                                          // 555
LocalCollection.prototype.update = function (selector, mod, options, callback) {                      // 556
  var self = this;                                                                                    // 557
  if (! callback && options instanceof Function) {                                                    // 558
    callback = options;                                                                               // 559
    options = null;                                                                                   // 560
  }                                                                                                   // 561
  if (!options) options = {};                                                                         // 562
                                                                                                      // 563
  var selector_f = LocalCollection._compileSelector(selector, self);                                  // 564
                                                                                                      // 565
  // Save the original results of any query that we might need to                                     // 566
  // _recomputeResults on, because _modifyAndNotify will mutate the objects in                        // 567
  // it. (We don't need to save the original results of paused queries because                        // 568
  // they already have a results_snapshot and we won't be diffing in                                  // 569
  // _recomputeResults.)                                                                              // 570
  var qidToOriginalResults = {};                                                                      // 571
  _.each(self.queries, function (query, qid) {                                                        // 572
    if ((query.cursor.skip || query.cursor.limit) && !query.paused)                                   // 573
      qidToOriginalResults[qid] = EJSON.clone(query.results);                                         // 574
  });                                                                                                 // 575
  var recomputeQids = {};                                                                             // 576
                                                                                                      // 577
  var updateCount = 0;                                                                                // 578
                                                                                                      // 579
  for (var id in self.docs) {                                                                         // 580
    var doc = self.docs[id];                                                                          // 581
    if (selector_f(doc)) {                                                                            // 582
      // XXX Should we save the original even if mod ends up being a no-op?                           // 583
      self._saveOriginal(id, doc);                                                                    // 584
      self._modifyAndNotify(doc, mod, recomputeQids);                                                 // 585
      ++updateCount;                                                                                  // 586
      if (!options.multi)                                                                             // 587
        break;                                                                                        // 588
    }                                                                                                 // 589
  }                                                                                                   // 590
                                                                                                      // 591
  _.each(recomputeQids, function (dummy, qid) {                                                       // 592
    var query = self.queries[qid];                                                                    // 593
    if (query)                                                                                        // 594
      LocalCollection._recomputeResults(query,                                                        // 595
                                        qidToOriginalResults[qid]);                                   // 596
  });                                                                                                 // 597
  self._observeQueue.drain();                                                                         // 598
                                                                                                      // 599
  // If we are doing an upsert, and we didn't modify any documents yet, then                          // 600
  // it's time to do an insert. Figure out what document we are inserting, and                        // 601
  // generate an id for it.                                                                           // 602
  var insertedId;                                                                                     // 603
  if (updateCount === 0 && options.upsert) {                                                          // 604
    var newDoc = LocalCollection._removeDollarOperators(selector);                                    // 605
    LocalCollection._modify(newDoc, mod, true);                                                       // 606
    if (! newDoc._id && options.insertedId)                                                           // 607
      newDoc._id = options.insertedId;                                                                // 608
    insertedId = self.insert(newDoc);                                                                 // 609
    updateCount = 1;                                                                                  // 610
  }                                                                                                   // 611
                                                                                                      // 612
  // Return the number of affected documents, or in the upsert case, an object                        // 613
  // containing the number of affected docs and the id of the doc that was                            // 614
  // inserted, if any.                                                                                // 615
  var result;                                                                                         // 616
  if (options._returnObject) {                                                                        // 617
    result = {                                                                                        // 618
      numberAffected: updateCount                                                                     // 619
    };                                                                                                // 620
    if (insertedId !== undefined)                                                                     // 621
      result.insertedId = insertedId;                                                                 // 622
  } else {                                                                                            // 623
    result = updateCount;                                                                             // 624
  }                                                                                                   // 625
                                                                                                      // 626
  if (callback)                                                                                       // 627
    Meteor.defer(function () {                                                                        // 628
      callback(null, result);                                                                         // 629
    });                                                                                               // 630
  return result;                                                                                      // 631
};                                                                                                    // 632
                                                                                                      // 633
// A convenience wrapper on update. LocalCollection.upsert(sel, mod) is                               // 634
// equivalent to LocalCollection.update(sel, mod, { upsert: true, _returnObject:                      // 635
// true }).                                                                                           // 636
LocalCollection.prototype.upsert = function (selector, mod, options, callback) {                      // 637
  var self = this;                                                                                    // 638
  if (! callback && typeof options === "function") {                                                  // 639
    callback = options;                                                                               // 640
    options = {};                                                                                     // 641
  }                                                                                                   // 642
  return self.update(selector, mod, _.extend({}, options, {                                           // 643
    upsert: true,                                                                                     // 644
    _returnObject: true                                                                               // 645
  }), callback);                                                                                      // 646
};                                                                                                    // 647
                                                                                                      // 648
LocalCollection.prototype._modifyAndNotify = function (                                               // 649
    doc, mod, recomputeQids) {                                                                        // 650
  var self = this;                                                                                    // 651
                                                                                                      // 652
  var matched_before = {};                                                                            // 653
  for (var qid in self.queries) {                                                                     // 654
    var query = self.queries[qid];                                                                    // 655
    if (query.ordered) {                                                                              // 656
      matched_before[qid] = query.selector_f(doc);                                                    // 657
    } else {                                                                                          // 658
      // Because we don't support skip or limit (yet) in unordered queries, we                        // 659
      // can just do a direct lookup.                                                                 // 660
      matched_before[qid] = _.has(query.results,                                                      // 661
                                  LocalCollection._idStringify(doc._id));                             // 662
    }                                                                                                 // 663
  }                                                                                                   // 664
                                                                                                      // 665
  var old_doc = EJSON.clone(doc);                                                                     // 666
                                                                                                      // 667
  LocalCollection._modify(doc, mod);                                                                  // 668
                                                                                                      // 669
  for (qid in self.queries) {                                                                         // 670
    query = self.queries[qid];                                                                        // 671
    var before = matched_before[qid];                                                                 // 672
    var after = query.selector_f(doc);                                                                // 673
                                                                                                      // 674
    if (query.cursor.skip || query.cursor.limit) {                                                    // 675
      // We need to recompute any query where the doc may have been in the                            // 676
      // cursor's window either before or after the update. (Note that if skip                        // 677
      // or limit is set, "before" and "after" being true do not necessarily                          // 678
      // mean that the document is in the cursor's output after skip/limit is                         // 679
      // applied... but if they are false, then the document definitely is NOT                        // 680
      // in the output. So it's safe to skip recompute if neither before or                           // 681
      // after are true.)                                                                             // 682
      if (before || after)                                                                            // 683
        recomputeQids[qid] = true;                                                                    // 684
    } else if (before && !after) {                                                                    // 685
      LocalCollection._removeFromResults(query, doc);                                                 // 686
    } else if (!before && after) {                                                                    // 687
      LocalCollection._insertInResults(query, doc);                                                   // 688
    } else if (before && after) {                                                                     // 689
      LocalCollection._updateInResults(query, doc, old_doc);                                          // 690
    }                                                                                                 // 691
  }                                                                                                   // 692
};                                                                                                    // 693
                                                                                                      // 694
// XXX the sorted-query logic below is laughably inefficient. we'll                                   // 695
// need to come up with a better datastructure for this.                                              // 696
//                                                                                                    // 697
// XXX the logic for observing with a skip or a limit is even more                                    // 698
// laughably inefficient. we recompute the whole results every time!                                  // 699
                                                                                                      // 700
LocalCollection._insertInResults = function (query, doc) {                                            // 701
  var fields = EJSON.clone(doc);                                                                      // 702
  delete fields._id;                                                                                  // 703
  if (query.ordered) {                                                                                // 704
    if (!query.sort_f) {                                                                              // 705
      query.addedBefore(doc._id, fields, null);                                                       // 706
      query.results.push(doc);                                                                        // 707
    } else {                                                                                          // 708
      var i = LocalCollection._insertInSortedList(                                                    // 709
        query.sort_f, query.results, doc);                                                            // 710
      var next = query.results[i+1];                                                                  // 711
      if (next)                                                                                       // 712
        next = next._id;                                                                              // 713
      else                                                                                            // 714
        next = null;                                                                                  // 715
      query.addedBefore(doc._id, fields, next);                                                       // 716
    }                                                                                                 // 717
    query.added(doc._id, fields);                                                                     // 718
  } else {                                                                                            // 719
    query.added(doc._id, fields);                                                                     // 720
    query.results[LocalCollection._idStringify(doc._id)] = doc;                                       // 721
  }                                                                                                   // 722
};                                                                                                    // 723
                                                                                                      // 724
LocalCollection._removeFromResults = function (query, doc) {                                          // 725
  if (query.ordered) {                                                                                // 726
    var i = LocalCollection._findInOrderedResults(query, doc);                                        // 727
    query.removed(doc._id);                                                                           // 728
    query.results.splice(i, 1);                                                                       // 729
  } else {                                                                                            // 730
    var id = LocalCollection._idStringify(doc._id);  // in case callback mutates doc                  // 731
    query.removed(doc._id);                                                                           // 732
    delete query.results[id];                                                                         // 733
  }                                                                                                   // 734
};                                                                                                    // 735
                                                                                                      // 736
LocalCollection._updateInResults = function (query, doc, old_doc) {                                   // 737
  if (!EJSON.equals(doc._id, old_doc._id))                                                            // 738
    throw new Error("Can't change a doc's _id while updating");                                       // 739
  var changedFields = LocalCollection._makeChangedFields(doc, old_doc);                               // 740
  if (!query.ordered) {                                                                               // 741
    if (!_.isEmpty(changedFields)) {                                                                  // 742
      query.changed(doc._id, changedFields);                                                          // 743
      query.results[LocalCollection._idStringify(doc._id)] = doc;                                     // 744
    }                                                                                                 // 745
    return;                                                                                           // 746
  }                                                                                                   // 747
                                                                                                      // 748
  var orig_idx = LocalCollection._findInOrderedResults(query, doc);                                   // 749
                                                                                                      // 750
  if (!_.isEmpty(changedFields))                                                                      // 751
    query.changed(doc._id, changedFields);                                                            // 752
  if (!query.sort_f)                                                                                  // 753
    return;                                                                                           // 754
                                                                                                      // 755
  // just take it out and put it back in again, and see if the index                                  // 756
  // changes                                                                                          // 757
  query.results.splice(orig_idx, 1);                                                                  // 758
  var new_idx = LocalCollection._insertInSortedList(                                                  // 759
    query.sort_f, query.results, doc);                                                                // 760
  if (orig_idx !== new_idx) {                                                                         // 761
    var next = query.results[new_idx+1];                                                              // 762
    if (next)                                                                                         // 763
      next = next._id;                                                                                // 764
    else                                                                                              // 765
      next = null;                                                                                    // 766
    query.movedBefore && query.movedBefore(doc._id, next);                                            // 767
  }                                                                                                   // 768
};                                                                                                    // 769
                                                                                                      // 770
// Recomputes the results of a query and runs observe callbacks for the                               // 771
// difference between the previous results and the current results (unless                            // 772
// paused). Used for skip/limit queries.                                                              // 773
//                                                                                                    // 774
// When this is used by insert or remove, it can just use query.results for the                       // 775
// old results (and there's no need to pass in oldResults), because these                             // 776
// operations don't mutate the documents in the collection. Update needs to pass                      // 777
// in an oldResults which was deep-copied before the modifier was applied.                            // 778
LocalCollection._recomputeResults = function (query, oldResults) {                                    // 779
  if (!oldResults)                                                                                    // 780
    oldResults = query.results;                                                                       // 781
  query.results = query.cursor._getRawObjects(query.ordered);                                         // 782
                                                                                                      // 783
  if (!query.paused) {                                                                                // 784
    LocalCollection._diffQueryChanges(                                                                // 785
      query.ordered, oldResults, query.results, query);                                               // 786
  }                                                                                                   // 787
};                                                                                                    // 788
                                                                                                      // 789
                                                                                                      // 790
LocalCollection._findInOrderedResults = function (query, doc) {                                       // 791
  if (!query.ordered)                                                                                 // 792
    throw new Error("Can't call _findInOrderedResults on unordered query");                           // 793
  for (var i = 0; i < query.results.length; i++)                                                      // 794
    if (query.results[i] === doc)                                                                     // 795
      return i;                                                                                       // 796
  throw Error("object missing from query");                                                           // 797
};                                                                                                    // 798
                                                                                                      // 799
// This binary search puts a value between any equal values, and the first                            // 800
// lesser value.                                                                                      // 801
LocalCollection._binarySearch = function (cmp, array, value) {                                        // 802
  var first = 0, rangeLength = array.length;                                                          // 803
                                                                                                      // 804
  while (rangeLength > 0) {                                                                           // 805
    var halfRange = Math.floor(rangeLength/2);                                                        // 806
    if (cmp(value, array[first + halfRange]) >= 0) {                                                  // 807
      first += halfRange + 1;                                                                         // 808
      rangeLength -= halfRange + 1;                                                                   // 809
    } else {                                                                                          // 810
      rangeLength = halfRange;                                                                        // 811
    }                                                                                                 // 812
  }                                                                                                   // 813
  return first;                                                                                       // 814
};                                                                                                    // 815
                                                                                                      // 816
LocalCollection._insertInSortedList = function (cmp, array, value) {                                  // 817
  if (array.length === 0) {                                                                           // 818
    array.push(value);                                                                                // 819
    return 0;                                                                                         // 820
  }                                                                                                   // 821
                                                                                                      // 822
  var idx = LocalCollection._binarySearch(cmp, array, value);                                         // 823
  array.splice(idx, 0, value);                                                                        // 824
  return idx;                                                                                         // 825
};                                                                                                    // 826
                                                                                                      // 827
// To track what documents are affected by a piece of code, call saveOriginals()                      // 828
// before it and retrieveOriginals() after it. retrieveOriginals returns an                           // 829
// object whose keys are the ids of the documents that were affected since the                        // 830
// call to saveOriginals(), and the values are equal to the document's contents                       // 831
// at the time of saveOriginals. (In the case of an inserted document, undefined                      // 832
// is the value.) You must alternate between calls to saveOriginals() and                             // 833
// retrieveOriginals().                                                                               // 834
LocalCollection.prototype.saveOriginals = function () {                                               // 835
  var self = this;                                                                                    // 836
  if (self._savedOriginals)                                                                           // 837
    throw new Error("Called saveOriginals twice without retrieveOriginals");                          // 838
  self._savedOriginals = {};                                                                          // 839
};                                                                                                    // 840
LocalCollection.prototype.retrieveOriginals = function () {                                           // 841
  var self = this;                                                                                    // 842
  if (!self._savedOriginals)                                                                          // 843
    throw new Error("Called retrieveOriginals without saveOriginals");                                // 844
                                                                                                      // 845
  var originals = self._savedOriginals;                                                               // 846
  self._savedOriginals = null;                                                                        // 847
  return originals;                                                                                   // 848
};                                                                                                    // 849
                                                                                                      // 850
LocalCollection.prototype._saveOriginal = function (id, doc) {                                        // 851
  var self = this;                                                                                    // 852
  // Are we even trying to save originals?                                                            // 853
  if (!self._savedOriginals)                                                                          // 854
    return;                                                                                           // 855
  // Have we previously mutated the original (and so 'doc' is not actually                            // 856
  // original)?  (Note the 'has' check rather than truth: we store undefined                          // 857
  // here for inserted docs!)                                                                         // 858
  if (_.has(self._savedOriginals, id))                                                                // 859
    return;                                                                                           // 860
  self._savedOriginals[id] = EJSON.clone(doc);                                                        // 861
};                                                                                                    // 862
                                                                                                      // 863
// Pause the observers. No callbacks from observers will fire until                                   // 864
// 'resumeObservers' is called.                                                                       // 865
LocalCollection.prototype.pauseObservers = function () {                                              // 866
  // No-op if already paused.                                                                         // 867
  if (this.paused)                                                                                    // 868
    return;                                                                                           // 869
                                                                                                      // 870
  // Set the 'paused' flag such that new observer messages don't fire.                                // 871
  this.paused = true;                                                                                 // 872
                                                                                                      // 873
  // Take a snapshot of the query results for each query.                                             // 874
  for (var qid in this.queries) {                                                                     // 875
    var query = this.queries[qid];                                                                    // 876
                                                                                                      // 877
    query.results_snapshot = EJSON.clone(query.results);                                              // 878
  }                                                                                                   // 879
};                                                                                                    // 880
                                                                                                      // 881
// Resume the observers. Observers immediately receive change                                         // 882
// notifications to bring them to the current state of the                                            // 883
// database. Note that this is not just replaying all the changes that                                // 884
// happened during the pause, it is a smarter 'coalesced' diff.                                       // 885
LocalCollection.prototype.resumeObservers = function () {                                             // 886
  var self = this;                                                                                    // 887
  // No-op if not paused.                                                                             // 888
  if (!this.paused)                                                                                   // 889
    return;                                                                                           // 890
                                                                                                      // 891
  // Unset the 'paused' flag. Make sure to do this first, otherwise                                   // 892
  // observer methods won't actually fire when we trigger them.                                       // 893
  this.paused = false;                                                                                // 894
                                                                                                      // 895
  for (var qid in this.queries) {                                                                     // 896
    var query = self.queries[qid];                                                                    // 897
    // Diff the current results against the snapshot and send to observers.                           // 898
    // pass the query object for its observer callbacks.                                              // 899
    LocalCollection._diffQueryChanges(                                                                // 900
      query.ordered, query.results_snapshot, query.results, query);                                   // 901
    query.results_snapshot = null;                                                                    // 902
  }                                                                                                   // 903
  self._observeQueue.drain();                                                                         // 904
};                                                                                                    // 905
                                                                                                      // 906
                                                                                                      // 907
// NB: used by livedata                                                                               // 908
LocalCollection._idStringify = function (id) {                                                        // 909
  if (id instanceof LocalCollection._ObjectID) {                                                      // 910
    return id.valueOf();                                                                              // 911
  } else if (typeof id === 'string') {                                                                // 912
    if (id === "") {                                                                                  // 913
      return id;                                                                                      // 914
    } else if (id.substr(0, 1) === "-" || // escape previously dashed strings                         // 915
               id.substr(0, 1) === "~" || // escape escaped numbers, true, false                      // 916
               LocalCollection._looksLikeObjectID(id) || // escape object-id-form strings             // 917
               id.substr(0, 1) === '{') { // escape object-form strings, for maybe implementing later // 918
      return "-" + id;                                                                                // 919
    } else {                                                                                          // 920
      return id; // other strings go through unchanged.                                               // 921
    }                                                                                                 // 922
  } else if (id === undefined) {                                                                      // 923
    return '-';                                                                                       // 924
  } else if (typeof id === 'object' && id !== null) {                                                 // 925
    throw new Error("Meteor does not currently support objects other than ObjectID as ids");          // 926
  } else { // Numbers, true, false, null                                                              // 927
    return "~" + JSON.stringify(id);                                                                  // 928
  }                                                                                                   // 929
};                                                                                                    // 930
                                                                                                      // 931
                                                                                                      // 932
// NB: used by livedata                                                                               // 933
LocalCollection._idParse = function (id) {                                                            // 934
  if (id === "") {                                                                                    // 935
    return id;                                                                                        // 936
  } else if (id === '-') {                                                                            // 937
    return undefined;                                                                                 // 938
  } else if (id.substr(0, 1) === '-') {                                                               // 939
    return id.substr(1);                                                                              // 940
  } else if (id.substr(0, 1) === '~') {                                                               // 941
    return JSON.parse(id.substr(1));                                                                  // 942
  } else if (LocalCollection._looksLikeObjectID(id)) {                                                // 943
    return new LocalCollection._ObjectID(id);                                                         // 944
  } else {                                                                                            // 945
    return id;                                                                                        // 946
  }                                                                                                   // 947
};                                                                                                    // 948
                                                                                                      // 949
LocalCollection._makeChangedFields = function (newDoc, oldDoc) {                                      // 950
  var fields = {};                                                                                    // 951
  LocalCollection._diffObjects(oldDoc, newDoc, {                                                      // 952
    leftOnly: function (key, value) {                                                                 // 953
      fields[key] = undefined;                                                                        // 954
    },                                                                                                // 955
    rightOnly: function (key, value) {                                                                // 956
      fields[key] = value;                                                                            // 957
    },                                                                                                // 958
    both: function (key, leftValue, rightValue) {                                                     // 959
      if (!EJSON.equals(leftValue, rightValue))                                                       // 960
        fields[key] = rightValue;                                                                     // 961
    }                                                                                                 // 962
  });                                                                                                 // 963
  return fields;                                                                                      // 964
};                                                                                                    // 965
                                                                                                      // 966
LocalCollection._observeFromObserveChanges = function (cursor, callbacks) {                           // 967
  var transform = cursor.getTransform();                                                              // 968
  if (!transform)                                                                                     // 969
    transform = function (doc) {return doc;};                                                         // 970
  if (callbacks.addedAt && callbacks.added)                                                           // 971
    throw new Error("Please specify only one of added() and addedAt()");                              // 972
  if (callbacks.changedAt && callbacks.changed)                                                       // 973
    throw new Error("Please specify only one of changed() and changedAt()");                          // 974
  if (callbacks.removed && callbacks.removedAt)                                                       // 975
    throw new Error("Please specify only one of removed() and removedAt()");                          // 976
  if (callbacks.addedAt || callbacks.movedTo ||                                                       // 977
      callbacks.changedAt || callbacks.removedAt)                                                     // 978
    return LocalCollection._observeOrderedFromObserveChanges(cursor, callbacks, transform);           // 979
  else                                                                                                // 980
    return LocalCollection._observeUnorderedFromObserveChanges(cursor, callbacks, transform);         // 981
};                                                                                                    // 982
                                                                                                      // 983
LocalCollection._observeUnorderedFromObserveChanges =                                                 // 984
    function (cursor, callbacks, transform) {                                                         // 985
  var docs = {};                                                                                      // 986
  var suppressed = !!callbacks._suppress_initial;                                                     // 987
  var handle = cursor.observeChanges({                                                                // 988
    added: function (id, fields) {                                                                    // 989
      var strId = LocalCollection._idStringify(id);                                                   // 990
      var doc = EJSON.clone(fields);                                                                  // 991
      doc._id = id;                                                                                   // 992
      docs[strId] = doc;                                                                              // 993
      suppressed || callbacks.added && callbacks.added(transform(doc));                               // 994
    },                                                                                                // 995
    changed: function (id, fields) {                                                                  // 996
      var strId = LocalCollection._idStringify(id);                                                   // 997
      var doc = docs[strId];                                                                          // 998
      var oldDoc = EJSON.clone(doc);                                                                  // 999
      // writes through to the doc set                                                                // 1000
      LocalCollection._applyChanges(doc, fields);                                                     // 1001
      suppressed || callbacks.changed && callbacks.changed(transform(doc), transform(oldDoc));        // 1002
    },                                                                                                // 1003
    removed: function (id) {                                                                          // 1004
      var strId = LocalCollection._idStringify(id);                                                   // 1005
      var doc = docs[strId];                                                                          // 1006
      delete docs[strId];                                                                             // 1007
      suppressed || callbacks.removed && callbacks.removed(transform(doc));                           // 1008
    }                                                                                                 // 1009
  });                                                                                                 // 1010
  suppressed = false;                                                                                 // 1011
  return handle;                                                                                      // 1012
};                                                                                                    // 1013
                                                                                                      // 1014
LocalCollection._observeOrderedFromObserveChanges =                                                   // 1015
    function (cursor, callbacks, transform) {                                                         // 1016
  var docs = new OrderedDict(LocalCollection._idStringify);                                           // 1017
  var suppressed = !!callbacks._suppress_initial;                                                     // 1018
  // The "_no_indices" option sets all index arguments to -1                                          // 1019
  // and skips the linear scans required to generate them.                                            // 1020
  // This lets observers that don't need absolute indices                                             // 1021
  // benefit from the other features of this API --                                                   // 1022
  // relative order, transforms, and applyChanges -- without                                          // 1023
  // the speed hit.                                                                                   // 1024
  var indices = !callbacks._no_indices;                                                               // 1025
  var handle = cursor.observeChanges({                                                                // 1026
    addedBefore: function (id, fields, before) {                                                      // 1027
      var doc = EJSON.clone(fields);                                                                  // 1028
      doc._id = id;                                                                                   // 1029
      // XXX could `before` be a falsy ID?  Technically                                               // 1030
      // idStringify seems to allow for them -- though                                                // 1031
      // OrderedDict won't call stringify on a falsy arg.                                             // 1032
      docs.putBefore(id, doc, before || null);                                                        // 1033
      if (!suppressed) {                                                                              // 1034
        if (callbacks.addedAt) {                                                                      // 1035
          var index = indices ? docs.indexOf(id) : -1;                                                // 1036
          callbacks.addedAt(transform(EJSON.clone(doc)),                                              // 1037
                            index, before);                                                           // 1038
        } else if (callbacks.added) {                                                                 // 1039
          callbacks.added(transform(EJSON.clone(doc)));                                               // 1040
        }                                                                                             // 1041
      }                                                                                               // 1042
    },                                                                                                // 1043
    changed: function (id, fields) {                                                                  // 1044
      var doc = docs.get(id);                                                                         // 1045
      if (!doc)                                                                                       // 1046
        throw new Error("Unknown id for changed: " + id);                                             // 1047
      var oldDoc = EJSON.clone(doc);                                                                  // 1048
      // writes through to the doc set                                                                // 1049
      LocalCollection._applyChanges(doc, fields);                                                     // 1050
      if (callbacks.changedAt) {                                                                      // 1051
        var index = indices ? docs.indexOf(id) : -1;                                                  // 1052
        callbacks.changedAt(transform(EJSON.clone(doc)),                                              // 1053
                            transform(oldDoc), index);                                                // 1054
      } else if (callbacks.changed) {                                                                 // 1055
        callbacks.changed(transform(EJSON.clone(doc)),                                                // 1056
                          transform(oldDoc));                                                         // 1057
      }                                                                                               // 1058
    },                                                                                                // 1059
    movedBefore: function (id, before) {                                                              // 1060
      var doc = docs.get(id);                                                                         // 1061
      var from;                                                                                       // 1062
      // only capture indexes if we're going to call the callback that needs them.                    // 1063
      if (callbacks.movedTo)                                                                          // 1064
        from = indices ? docs.indexOf(id) : -1;                                                       // 1065
      docs.moveBefore(id, before || null);                                                            // 1066
      if (callbacks.movedTo) {                                                                        // 1067
        var to = indices ? docs.indexOf(id) : -1;                                                     // 1068
        callbacks.movedTo(transform(EJSON.clone(doc)), from, to,                                      // 1069
                          before || null);                                                            // 1070
      } else if (callbacks.moved) {                                                                   // 1071
        callbacks.moved(transform(EJSON.clone(doc)));                                                 // 1072
      }                                                                                               // 1073
                                                                                                      // 1074
    },                                                                                                // 1075
    removed: function (id) {                                                                          // 1076
      var doc = docs.get(id);                                                                         // 1077
      var index;                                                                                      // 1078
      if (callbacks.removedAt)                                                                        // 1079
        index = indices ? docs.indexOf(id) : -1;                                                      // 1080
      docs.remove(id);                                                                                // 1081
      callbacks.removedAt && callbacks.removedAt(transform(doc), index);                              // 1082
      callbacks.removed && callbacks.removed(transform(doc));                                         // 1083
    }                                                                                                 // 1084
  });                                                                                                 // 1085
  suppressed = false;                                                                                 // 1086
  return handle;                                                                                      // 1087
};                                                                                                    // 1088
                                                                                                      // 1089
LocalCollection._compileProjection = function (fields) {                                              // 1090
  if (!_.isObject(fields))                                                                            // 1091
    throw MinimongoError("fields option must be an object");                                          // 1092
                                                                                                      // 1093
  if (_.any(_.values(fields), function (x) {                                                          // 1094
      return _.indexOf([1, 0, true, false], x) === -1; }))                                            // 1095
    throw MinimongoError("Projection values should be one of 1, 0, true, or false");                  // 1096
                                                                                                      // 1097
  var _idProjection = _.isUndefined(fields._id) ? true : fields._id;                                  // 1098
  // Find the non-_id keys (_id is handled specially because it is included unless                    // 1099
  // explicitly excluded). Sort the keys, so that our code to detect overlaps                         // 1100
  // like 'foo' and 'foo.bar' can assume that 'foo' comes first.                                      // 1101
  var fieldsKeys = _.reject(_.keys(fields).sort(), function (key) { return key === '_id'; });         // 1102
  var including = null; // Unknown                                                                    // 1103
  var projectionRulesTree = {}; // Tree represented as nested objects                                 // 1104
                                                                                                      // 1105
  _.each(fieldsKeys, function (keyPath) {                                                             // 1106
    var rule = !!fields[keyPath];                                                                     // 1107
    if (including === null)                                                                           // 1108
      including = rule;                                                                               // 1109
    if (including !== rule)                                                                           // 1110
      // This error message is copies from MongoDB shell                                              // 1111
      throw MinimongoError("You cannot currently mix including and excluding fields.");               // 1112
    var treePos = projectionRulesTree;                                                                // 1113
    keyPath = keyPath.split('.');                                                                     // 1114
                                                                                                      // 1115
    _.each(keyPath.slice(0, -1), function (key, idx) {                                                // 1116
      if (!_.has(treePos, key))                                                                       // 1117
        treePos[key] = {};                                                                            // 1118
      else if (_.isBoolean(treePos[key])) {                                                           // 1119
        // Check passed projection fields' keys: If you have two rules such as                        // 1120
        // 'foo.bar' and 'foo.bar.baz', then the result becomes ambiguous. If                         // 1121
        // that happens, there is a probability you are doing something wrong,                        // 1122
        // framework should notify you about such mistake earlier on cursor                           // 1123
        // compilation step than later during runtime.  Note, that real mongo                         // 1124
        // doesn't do anything about it and the later rule appears in projection                      // 1125
        // project, more priority it takes.                                                           // 1126
        //                                                                                            // 1127
        // Example, assume following in mongo shell:                                                  // 1128
        // > db.coll.insert({ a: { b: 23, c: 44 } })                                                  // 1129
        // > db.coll.find({}, { 'a': 1, 'a.b': 1 })                                                   // 1130
        // { "_id" : ObjectId("520bfe456024608e8ef24af3"), "a" : { "b" : 23 } }                       // 1131
        // > db.coll.find({}, { 'a.b': 1, 'a': 1 })                                                   // 1132
        // { "_id" : ObjectId("520bfe456024608e8ef24af3"), "a" : { "b" : 23, "c" : 44 } }             // 1133
        //                                                                                            // 1134
        // Note, how second time the return set of keys is different.                                 // 1135
                                                                                                      // 1136
        var currentPath = keyPath.join('.');                                                          // 1137
        var anotherPath = keyPath.slice(0, idx + 1).join('.');                                        // 1138
        throw MinimongoError("both " + currentPath + " and " + anotherPath +                          // 1139
         " found in fields option, using both of them may trigger " +                                 // 1140
         "unexpected behavior. Did you mean to use only one of them?");                               // 1141
      }                                                                                               // 1142
                                                                                                      // 1143
      treePos = treePos[key];                                                                         // 1144
    });                                                                                               // 1145
                                                                                                      // 1146
    treePos[_.last(keyPath)] = including;                                                             // 1147
  });                                                                                                 // 1148
                                                                                                      // 1149
  // returns transformed doc according to ruleTree                                                    // 1150
  var transform = function (doc, ruleTree) {                                                          // 1151
    // Special case for "sets"                                                                        // 1152
    if (_.isArray(doc))                                                                               // 1153
      return _.map(doc, function (subdoc) { return transform(subdoc, ruleTree); });                   // 1154
                                                                                                      // 1155
    var res = including ? {} : EJSON.clone(doc);                                                      // 1156
    _.each(ruleTree, function (rule, key) {                                                           // 1157
      if (!_.has(doc, key))                                                                           // 1158
        return;                                                                                       // 1159
      if (_.isObject(rule)) {                                                                         // 1160
        // For sub-objects/subsets we branch                                                          // 1161
        if (_.isObject(doc[key]))                                                                     // 1162
          res[key] = transform(doc[key], rule);                                                       // 1163
        // Otherwise we don't even touch this subfield                                                // 1164
      } else if (including)                                                                           // 1165
        res[key] = doc[key];                                                                          // 1166
      else                                                                                            // 1167
        delete res[key];                                                                              // 1168
    });                                                                                               // 1169
                                                                                                      // 1170
    return res;                                                                                       // 1171
  };                                                                                                  // 1172
                                                                                                      // 1173
  return function (obj) {                                                                             // 1174
    var res = transform(obj, projectionRulesTree);                                                    // 1175
                                                                                                      // 1176
    if (_idProjection && _.has(obj, '_id'))                                                           // 1177
      res._id = obj._id;                                                                              // 1178
    if (!_idProjection && _.has(res, '_id'))                                                          // 1179
      delete res._id;                                                                                 // 1180
    return res;                                                                                       // 1181
  };                                                                                                  // 1182
};                                                                                                    // 1183
                                                                                                      // 1184
// Searches $near operator in the selector recursively                                                // 1185
// (including all $or/$and/$nor/$not branches)                                                        // 1186
var isGeoQuery = function (selector) {                                                                // 1187
  return _.any(selector, function (val, key) {                                                        // 1188
    // Note: _.isObject matches objects and arrays                                                    // 1189
    return key === "$near" || (_.isObject(val) && isGeoQuery(val));                                   // 1190
  });                                                                                                 // 1191
};                                                                                                    // 1192
                                                                                                      // 1193
// Checks if $near appears under some $or/$and/$nor/$not branch                                       // 1194
var isGeoQuerySpecial = function (selector) {                                                         // 1195
  return _.any(selector, function (val, key) {                                                        // 1196
    if (_.contains(['$or', '$and', '$nor', '$not'], key))                                             // 1197
      return isGeoQuery(val);                                                                         // 1198
    // Note: _.isObject matches objects and arrays                                                    // 1199
    return _.isObject(val) && isGeoQuerySpecial(val);                                                 // 1200
  });                                                                                                 // 1201
};                                                                                                    // 1202
                                                                                                      // 1203
                                                                                                      // 1204
////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/minimongo/selector.js                                                                     //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
// Like _.isArray, but doesn't regard polyfilled Uint8Arrays on old browsers as                       // 1
// arrays.                                                                                            // 2
var isArray = function (x) {                                                                          // 3
  return _.isArray(x) && !EJSON.isBinary(x);                                                          // 4
};                                                                                                    // 5
                                                                                                      // 6
var _anyIfArray = function (x, f) {                                                                   // 7
  if (isArray(x))                                                                                     // 8
    return _.any(x, f);                                                                               // 9
  return f(x);                                                                                        // 10
};                                                                                                    // 11
                                                                                                      // 12
var _anyIfArrayPlus = function (x, f) {                                                               // 13
  if (f(x))                                                                                           // 14
    return true;                                                                                      // 15
  return isArray(x) && _.any(x, f);                                                                   // 16
};                                                                                                    // 17
                                                                                                      // 18
var hasOperators = function(valueSelector) {                                                          // 19
  var theseAreOperators = undefined;                                                                  // 20
  for (var selKey in valueSelector) {                                                                 // 21
    var thisIsOperator = selKey.substr(0, 1) === '$';                                                 // 22
    if (theseAreOperators === undefined) {                                                            // 23
      theseAreOperators = thisIsOperator;                                                             // 24
    } else if (theseAreOperators !== thisIsOperator) {                                                // 25
      throw new Error("Inconsistent selector: " + valueSelector);                                     // 26
    }                                                                                                 // 27
  }                                                                                                   // 28
  return !!theseAreOperators;  // {} has no operators                                                 // 29
};                                                                                                    // 30
                                                                                                      // 31
var compileValueSelector = function (valueSelector, selector, cursor) {                               // 32
  if (valueSelector == null) {  // undefined or null                                                  // 33
    return function (value) {                                                                         // 34
      return _anyIfArray(value, function (x) {                                                        // 35
        return x == null;  // undefined or null                                                       // 36
      });                                                                                             // 37
    };                                                                                                // 38
  }                                                                                                   // 39
                                                                                                      // 40
  // Selector is a non-null primitive (and not an array or RegExp either).                            // 41
  if (!_.isObject(valueSelector)) {                                                                   // 42
    return function (value) {                                                                         // 43
      return _anyIfArray(value, function (x) {                                                        // 44
        return x === valueSelector;                                                                   // 45
      });                                                                                             // 46
    };                                                                                                // 47
  }                                                                                                   // 48
                                                                                                      // 49
  if (valueSelector instanceof RegExp) {                                                              // 50
    return function (value) {                                                                         // 51
      if (value === undefined)                                                                        // 52
        return false;                                                                                 // 53
      return _anyIfArray(value, function (x) {                                                        // 54
        return valueSelector.test(x);                                                                 // 55
      });                                                                                             // 56
    };                                                                                                // 57
  }                                                                                                   // 58
                                                                                                      // 59
  // Arrays match either identical arrays or arrays that contain it as a value.                       // 60
  if (isArray(valueSelector)) {                                                                       // 61
    return function (value) {                                                                         // 62
      if (!isArray(value))                                                                            // 63
        return false;                                                                                 // 64
      return _anyIfArrayPlus(value, function (x) {                                                    // 65
        return LocalCollection._f._equal(valueSelector, x);                                           // 66
      });                                                                                             // 67
    };                                                                                                // 68
  }                                                                                                   // 69
                                                                                                      // 70
  // It's an object, but not an array or regexp.                                                      // 71
  if (hasOperators(valueSelector)) {                                                                  // 72
    var operatorFunctions = [];                                                                       // 73
    _.each(valueSelector, function (operand, operator) {                                              // 74
      if (!_.has(VALUE_OPERATORS, operator))                                                          // 75
        throw new Error("Unrecognized operator: " + operator);                                        // 76
      // Special case for location operators                                                          // 77
      operatorFunctions.push(VALUE_OPERATORS[operator](                                               // 78
        operand, valueSelector, cursor));                                                             // 79
    });                                                                                               // 80
    return function (value, doc) {                                                                    // 81
      return _.all(operatorFunctions, function (f) {                                                  // 82
        return f(value, doc);                                                                         // 83
      });                                                                                             // 84
    };                                                                                                // 85
  }                                                                                                   // 86
                                                                                                      // 87
  // It's a literal; compare value (or element of value array) directly to the                        // 88
  // selector.                                                                                        // 89
  return function (value) {                                                                           // 90
    return _anyIfArray(value, function (x) {                                                          // 91
      return LocalCollection._f._equal(valueSelector, x);                                             // 92
    });                                                                                               // 93
  };                                                                                                  // 94
};                                                                                                    // 95
                                                                                                      // 96
// XXX can factor out common logic below                                                              // 97
var LOGICAL_OPERATORS = {                                                                             // 98
  "$and": function(subSelector, operators, cursor) {                                                  // 99
    if (!isArray(subSelector) || _.isEmpty(subSelector))                                              // 100
      throw Error("$and/$or/$nor must be nonempty array");                                            // 101
    var subSelectorFunctions = _.map(subSelector, function (selector) {                               // 102
      return compileDocumentSelector(selector, cursor); });                                           // 103
    return function (doc, wholeDoc) {                                                                 // 104
      return _.all(subSelectorFunctions, function (f) {                                               // 105
        return f(doc, wholeDoc);                                                                      // 106
      });                                                                                             // 107
    };                                                                                                // 108
  },                                                                                                  // 109
                                                                                                      // 110
  "$or": function(subSelector, operators, cursor) {                                                   // 111
    if (!isArray(subSelector) || _.isEmpty(subSelector))                                              // 112
      throw Error("$and/$or/$nor must be nonempty array");                                            // 113
    var subSelectorFunctions = _.map(subSelector, function (selector) {                               // 114
      return compileDocumentSelector(selector, cursor); });                                           // 115
    return function (doc, wholeDoc) {                                                                 // 116
      return _.any(subSelectorFunctions, function (f) {                                               // 117
        return f(doc, wholeDoc);                                                                      // 118
      });                                                                                             // 119
    };                                                                                                // 120
  },                                                                                                  // 121
                                                                                                      // 122
  "$nor": function(subSelector, operators, cursor) {                                                  // 123
    if (!isArray(subSelector) || _.isEmpty(subSelector))                                              // 124
      throw Error("$and/$or/$nor must be nonempty array");                                            // 125
    var subSelectorFunctions = _.map(subSelector, function (selector) {                               // 126
      return compileDocumentSelector(selector, cursor); });                                           // 127
    return function (doc, wholeDoc) {                                                                 // 128
      return _.all(subSelectorFunctions, function (f) {                                               // 129
        return !f(doc, wholeDoc);                                                                     // 130
      });                                                                                             // 131
    };                                                                                                // 132
  },                                                                                                  // 133
                                                                                                      // 134
  "$where": function(selectorValue) {                                                                 // 135
    if (!(selectorValue instanceof Function)) {                                                       // 136
      selectorValue = Function("return " + selectorValue);                                            // 137
    }                                                                                                 // 138
    return function (doc) {                                                                           // 139
      return selectorValue.call(doc);                                                                 // 140
    };                                                                                                // 141
  }                                                                                                   // 142
};                                                                                                    // 143
                                                                                                      // 144
// Each value operator is a function with args:                                                       // 145
//  - operand - Anything                                                                              // 146
//  - operators - Object - operators on the same level (neighbours)                                   // 147
//  - cursor - Object - original cursor                                                               // 148
// returns a function with args:                                                                      // 149
//  - value - a value the operator is tested against                                                  // 150
//  - doc - the whole document tested in this query                                                   // 151
var VALUE_OPERATORS = {                                                                               // 152
  "$in": function (operand) {                                                                         // 153
    if (!isArray(operand))                                                                            // 154
      throw new Error("Argument to $in must be array");                                               // 155
    return function (value) {                                                                         // 156
      return _anyIfArrayPlus(value, function (x) {                                                    // 157
        return _.any(operand, function (operandElt) {                                                 // 158
          return LocalCollection._f._equal(operandElt, x);                                            // 159
        });                                                                                           // 160
      });                                                                                             // 161
    };                                                                                                // 162
  },                                                                                                  // 163
                                                                                                      // 164
  "$all": function (operand) {                                                                        // 165
    if (!isArray(operand))                                                                            // 166
      throw new Error("Argument to $all must be array");                                              // 167
    return function (value) {                                                                         // 168
      if (!isArray(value))                                                                            // 169
        return false;                                                                                 // 170
      return _.all(operand, function (operandElt) {                                                   // 171
        return _.any(value, function (valueElt) {                                                     // 172
          return LocalCollection._f._equal(operandElt, valueElt);                                     // 173
        });                                                                                           // 174
      });                                                                                             // 175
    };                                                                                                // 176
  },                                                                                                  // 177
                                                                                                      // 178
  "$lt": function (operand) {                                                                         // 179
    return function (value) {                                                                         // 180
      return _anyIfArray(value, function (x) {                                                        // 181
        return LocalCollection._f._cmp(x, operand) < 0;                                               // 182
      });                                                                                             // 183
    };                                                                                                // 184
  },                                                                                                  // 185
                                                                                                      // 186
  "$lte": function (operand) {                                                                        // 187
    return function (value) {                                                                         // 188
      return _anyIfArray(value, function (x) {                                                        // 189
        return LocalCollection._f._cmp(x, operand) <= 0;                                              // 190
      });                                                                                             // 191
    };                                                                                                // 192
  },                                                                                                  // 193
                                                                                                      // 194
  "$gt": function (operand) {                                                                         // 195
    return function (value) {                                                                         // 196
      return _anyIfArray(value, function (x) {                                                        // 197
        return LocalCollection._f._cmp(x, operand) > 0;                                               // 198
      });                                                                                             // 199
    };                                                                                                // 200
  },                                                                                                  // 201
                                                                                                      // 202
  "$gte": function (operand) {                                                                        // 203
    return function (value) {                                                                         // 204
      return _anyIfArray(value, function (x) {                                                        // 205
        return LocalCollection._f._cmp(x, operand) >= 0;                                              // 206
      });                                                                                             // 207
    };                                                                                                // 208
  },                                                                                                  // 209
                                                                                                      // 210
  "$ne": function (operand) {                                                                         // 211
    return function (value) {                                                                         // 212
      return ! _anyIfArrayPlus(value, function (x) {                                                  // 213
        return LocalCollection._f._equal(x, operand);                                                 // 214
      });                                                                                             // 215
    };                                                                                                // 216
  },                                                                                                  // 217
                                                                                                      // 218
  "$nin": function (operand) {                                                                        // 219
    if (!isArray(operand))                                                                            // 220
      throw new Error("Argument to $nin must be array");                                              // 221
    var inFunction = VALUE_OPERATORS.$in(operand);                                                    // 222
    return function (value, doc) {                                                                    // 223
      // Field doesn't exist, so it's not-in operand                                                  // 224
      if (value === undefined)                                                                        // 225
        return true;                                                                                  // 226
      return !inFunction(value, doc);                                                                 // 227
    };                                                                                                // 228
  },                                                                                                  // 229
                                                                                                      // 230
  "$exists": function (operand) {                                                                     // 231
    return function (value) {                                                                         // 232
      return operand === (value !== undefined);                                                       // 233
    };                                                                                                // 234
  },                                                                                                  // 235
                                                                                                      // 236
  "$mod": function (operand) {                                                                        // 237
    var divisor = operand[0],                                                                         // 238
        remainder = operand[1];                                                                       // 239
    return function (value) {                                                                         // 240
      return _anyIfArray(value, function (x) {                                                        // 241
        return x % divisor === remainder;                                                             // 242
      });                                                                                             // 243
    };                                                                                                // 244
  },                                                                                                  // 245
                                                                                                      // 246
  "$size": function (operand) {                                                                       // 247
    return function (value) {                                                                         // 248
      return isArray(value) && operand === value.length;                                              // 249
    };                                                                                                // 250
  },                                                                                                  // 251
                                                                                                      // 252
  "$type": function (operand) {                                                                       // 253
    return function (value) {                                                                         // 254
      // A nonexistent field is of no type.                                                           // 255
      if (value === undefined)                                                                        // 256
        return false;                                                                                 // 257
      // Definitely not _anyIfArrayPlus: $type: 4 only matches arrays that have                       // 258
      // arrays as elements according to the Mongo docs.                                              // 259
      return _anyIfArray(value, function (x) {                                                        // 260
        return LocalCollection._f._type(x) === operand;                                               // 261
      });                                                                                             // 262
    };                                                                                                // 263
  },                                                                                                  // 264
                                                                                                      // 265
  "$regex": function (operand, operators) {                                                           // 266
    var options = operators.$options;                                                                 // 267
    if (options !== undefined) {                                                                      // 268
      // Options passed in $options (even the empty string) always overrides                          // 269
      // options in the RegExp object itself. (See also                                               // 270
      // Meteor.Collection._rewriteSelector.)                                                         // 271
                                                                                                      // 272
      // Be clear that we only support the JS-supported options, not extended                         // 273
      // ones (eg, Mongo supports x and s). Ideally we would implement x and s                        // 274
      // by transforming the regexp, but not today...                                                 // 275
      if (/[^gim]/.test(options))                                                                     // 276
        throw new Error("Only the i, m, and g regexp options are supported");                         // 277
                                                                                                      // 278
      var regexSource = operand instanceof RegExp ? operand.source : operand;                         // 279
      operand = new RegExp(regexSource, options);                                                     // 280
    } else if (!(operand instanceof RegExp)) {                                                        // 281
      operand = new RegExp(operand);                                                                  // 282
    }                                                                                                 // 283
                                                                                                      // 284
    return function (value) {                                                                         // 285
      if (value === undefined)                                                                        // 286
        return false;                                                                                 // 287
      return _anyIfArray(value, function (x) {                                                        // 288
        return operand.test(x);                                                                       // 289
      });                                                                                             // 290
    };                                                                                                // 291
  },                                                                                                  // 292
                                                                                                      // 293
  "$options": function (operand) {                                                                    // 294
    // evaluation happens at the $regex function above                                                // 295
    return function (value) { return true; };                                                         // 296
  },                                                                                                  // 297
                                                                                                      // 298
  "$elemMatch": function (operand, selector, cursor) {                                                // 299
    var matcher = compileDocumentSelector(operand, cursor);                                           // 300
    return function (value, doc) {                                                                    // 301
      if (!isArray(value))                                                                            // 302
        return false;                                                                                 // 303
      return _.any(value, function (x) {                                                              // 304
        return matcher(x, doc);                                                                       // 305
      });                                                                                             // 306
    };                                                                                                // 307
  },                                                                                                  // 308
                                                                                                      // 309
  "$not": function (operand, operators, cursor) {                                                     // 310
    var matcher = compileValueSelector(operand, operators, cursor);                                   // 311
    return function (value, doc) {                                                                    // 312
      return !matcher(value, doc);                                                                    // 313
    };                                                                                                // 314
  },                                                                                                  // 315
                                                                                                      // 316
  "$near": function (operand, operators, cursor) {                                                    // 317
    function distanceCoordinatePairs (a, b) {                                                         // 318
      a = pointToArray(a);                                                                            // 319
      b = pointToArray(b);                                                                            // 320
      var x = a[0] - b[0];                                                                            // 321
      var y = a[1] - b[1];                                                                            // 322
      if (_.isNaN(x) || _.isNaN(y))                                                                   // 323
        return null;                                                                                  // 324
      return Math.sqrt(x * x + y * y);                                                                // 325
    }                                                                                                 // 326
    // Makes sure we get 2 elements array and assume the first one to be x and                        // 327
    // the second one to y no matter what user passes.                                                // 328
    // In case user passes { lon: x, lat: y } returns [x, y]                                          // 329
    function pointToArray (point) {                                                                   // 330
      return _.map(point, _.identity);                                                                // 331
    }                                                                                                 // 332
    // GeoJSON query is marked as $geometry property                                                  // 333
    var mode = _.isObject(operand) && _.has(operand, '$geometry') ? "2dsphere" : "2d";                // 334
    var maxDistance = mode === "2d" ? operators.$maxDistance : operand.$maxDistance;                  // 335
    var point = mode === "2d" ? operand : operand.$geometry;                                          // 336
    return function (value, doc) {                                                                    // 337
      var dist = null;                                                                                // 338
      switch (mode) {                                                                                 // 339
        case "2d":                                                                                    // 340
          dist = distanceCoordinatePairs(point, value);                                               // 341
          break;                                                                                      // 342
        case "2dsphere":                                                                              // 343
          // XXX: for now, we don't calculate the actual distance between, say,                       // 344
          // polygon and circle. If people care about this use-case it will get                       // 345
          // a priority.                                                                              // 346
          if (value.type === "Point")                                                                 // 347
            dist = GeoJSON.pointDistance(point, value);                                               // 348
          else                                                                                        // 349
            dist = GeoJSON.geometryWithinRadius(value, point, maxDistance) ?                          // 350
                     0 : maxDistance + 1;                                                             // 351
          break;                                                                                      // 352
      }                                                                                               // 353
      // Used later in sorting by distance, since $near queries are sorted by                         // 354
      // distance from closest to farthest.                                                           // 355
      if (cursor) {                                                                                   // 356
        if (!cursor._distance)                                                                        // 357
          cursor._distance = {};                                                                      // 358
        cursor._distance[doc._id] = dist;                                                             // 359
      }                                                                                               // 360
                                                                                                      // 361
      // Distance couldn't parse a geometry object                                                    // 362
      if (dist === null)                                                                              // 363
        return false;                                                                                 // 364
                                                                                                      // 365
      return maxDistance === undefined ? true : dist <= maxDistance;                                  // 366
    };                                                                                                // 367
  },                                                                                                  // 368
                                                                                                      // 369
  "$maxDistance": function () {                                                                       // 370
    // evaluation happens in the $near operator                                                       // 371
    return function () { return true; }                                                               // 372
  }                                                                                                   // 373
};                                                                                                    // 374
                                                                                                      // 375
// helpers used by compiled selector code                                                             // 376
LocalCollection._f = {                                                                                // 377
  // XXX for _all and _in, consider building 'inquery' at compile time..                              // 378
                                                                                                      // 379
  _type: function (v) {                                                                               // 380
    if (typeof v === "number")                                                                        // 381
      return 1;                                                                                       // 382
    if (typeof v === "string")                                                                        // 383
      return 2;                                                                                       // 384
    if (typeof v === "boolean")                                                                       // 385
      return 8;                                                                                       // 386
    if (isArray(v))                                                                                   // 387
      return 4;                                                                                       // 388
    if (v === null)                                                                                   // 389
      return 10;                                                                                      // 390
    if (v instanceof RegExp)                                                                          // 391
      return 11;                                                                                      // 392
    if (typeof v === "function")                                                                      // 393
      // note that typeof(/x/) === "function"                                                         // 394
      return 13;                                                                                      // 395
    if (v instanceof Date)                                                                            // 396
      return 9;                                                                                       // 397
    if (EJSON.isBinary(v))                                                                            // 398
      return 5;                                                                                       // 399
    if (v instanceof LocalCollection._ObjectID)                                                       // 400
      return 7;                                                                                       // 401
    return 3; // object                                                                               // 402
                                                                                                      // 403
    // XXX support some/all of these:                                                                 // 404
    // 14, symbol                                                                                     // 405
    // 15, javascript code with scope                                                                 // 406
    // 16, 18: 32-bit/64-bit integer                                                                  // 407
    // 17, timestamp                                                                                  // 408
    // 255, minkey                                                                                    // 409
    // 127, maxkey                                                                                    // 410
  },                                                                                                  // 411
                                                                                                      // 412
  // deep equality test: use for literal document and array matches                                   // 413
  _equal: function (a, b) {                                                                           // 414
    return EJSON.equals(a, b, {keyOrderSensitive: true});                                             // 415
  },                                                                                                  // 416
                                                                                                      // 417
  // maps a type code to a value that can be used to sort values of                                   // 418
  // different types                                                                                  // 419
  _typeorder: function (t) {                                                                          // 420
    // http://www.mongodb.org/display/DOCS/What+is+the+Compare+Order+for+BSON+Types                   // 421
    // XXX what is the correct sort position for Javascript code?                                     // 422
    // ('100' in the matrix below)                                                                    // 423
    // XXX minkey/maxkey                                                                              // 424
    return [-1,  // (not a type)                                                                      // 425
            1,   // number                                                                            // 426
            2,   // string                                                                            // 427
            3,   // object                                                                            // 428
            4,   // array                                                                             // 429
            5,   // binary                                                                            // 430
            -1,  // deprecated                                                                        // 431
            6,   // ObjectID                                                                          // 432
            7,   // bool                                                                              // 433
            8,   // Date                                                                              // 434
            0,   // null                                                                              // 435
            9,   // RegExp                                                                            // 436
            -1,  // deprecated                                                                        // 437
            100, // JS code                                                                           // 438
            2,   // deprecated (symbol)                                                               // 439
            100, // JS code                                                                           // 440
            1,   // 32-bit int                                                                        // 441
            8,   // Mongo timestamp                                                                   // 442
            1    // 64-bit int                                                                        // 443
           ][t];                                                                                      // 444
  },                                                                                                  // 445
                                                                                                      // 446
  // compare two values of unknown type according to BSON ordering                                    // 447
  // semantics. (as an extension, consider 'undefined' to be less than                                // 448
  // any other value.) return negative if a is less, positive if b is                                 // 449
  // less, or 0 if equal                                                                              // 450
  _cmp: function (a, b) {                                                                             // 451
    if (a === undefined)                                                                              // 452
      return b === undefined ? 0 : -1;                                                                // 453
    if (b === undefined)                                                                              // 454
      return 1;                                                                                       // 455
    var ta = LocalCollection._f._type(a);                                                             // 456
    var tb = LocalCollection._f._type(b);                                                             // 457
    var oa = LocalCollection._f._typeorder(ta);                                                       // 458
    var ob = LocalCollection._f._typeorder(tb);                                                       // 459
    if (oa !== ob)                                                                                    // 460
      return oa < ob ? -1 : 1;                                                                        // 461
    if (ta !== tb)                                                                                    // 462
      // XXX need to implement this if we implement Symbol or integers, or                            // 463
      // Timestamp                                                                                    // 464
      throw Error("Missing type coercion logic in _cmp");                                             // 465
    if (ta === 7) { // ObjectID                                                                       // 466
      // Convert to string.                                                                           // 467
      ta = tb = 2;                                                                                    // 468
      a = a.toHexString();                                                                            // 469
      b = b.toHexString();                                                                            // 470
    }                                                                                                 // 471
    if (ta === 9) { // Date                                                                           // 472
      // Convert to millis.                                                                           // 473
      ta = tb = 1;                                                                                    // 474
      a = a.getTime();                                                                                // 475
      b = b.getTime();                                                                                // 476
    }                                                                                                 // 477
                                                                                                      // 478
    if (ta === 1) // double                                                                           // 479
      return a - b;                                                                                   // 480
    if (tb === 2) // string                                                                           // 481
      return a < b ? -1 : (a === b ? 0 : 1);                                                          // 482
    if (ta === 3) { // Object                                                                         // 483
      // this could be much more efficient in the expected case ...                                   // 484
      var to_array = function (obj) {                                                                 // 485
        var ret = [];                                                                                 // 486
        for (var key in obj) {                                                                        // 487
          ret.push(key);                                                                              // 488
          ret.push(obj[key]);                                                                         // 489
        }                                                                                             // 490
        return ret;                                                                                   // 491
      };                                                                                              // 492
      return LocalCollection._f._cmp(to_array(a), to_array(b));                                       // 493
    }                                                                                                 // 494
    if (ta === 4) { // Array                                                                          // 495
      for (var i = 0; ; i++) {                                                                        // 496
        if (i === a.length)                                                                           // 497
          return (i === b.length) ? 0 : -1;                                                           // 498
        if (i === b.length)                                                                           // 499
          return 1;                                                                                   // 500
        var s = LocalCollection._f._cmp(a[i], b[i]);                                                  // 501
        if (s !== 0)                                                                                  // 502
          return s;                                                                                   // 503
      }                                                                                               // 504
    }                                                                                                 // 505
    if (ta === 5) { // binary                                                                         // 506
      // Surprisingly, a small binary blob is always less than a large one in                         // 507
      // Mongo.                                                                                       // 508
      if (a.length !== b.length)                                                                      // 509
        return a.length - b.length;                                                                   // 510
      for (i = 0; i < a.length; i++) {                                                                // 511
        if (a[i] < b[i])                                                                              // 512
          return -1;                                                                                  // 513
        if (a[i] > b[i])                                                                              // 514
          return 1;                                                                                   // 515
      }                                                                                               // 516
      return 0;                                                                                       // 517
    }                                                                                                 // 518
    if (ta === 8) { // boolean                                                                        // 519
      if (a) return b ? 0 : 1;                                                                        // 520
      return b ? -1 : 0;                                                                              // 521
    }                                                                                                 // 522
    if (ta === 10) // null                                                                            // 523
      return 0;                                                                                       // 524
    if (ta === 11) // regexp                                                                          // 525
      throw Error("Sorting not supported on regular expression"); // XXX                              // 526
    // 13: javascript code                                                                            // 527
    // 14: symbol                                                                                     // 528
    // 15: javascript code with scope                                                                 // 529
    // 16: 32-bit integer                                                                             // 530
    // 17: timestamp                                                                                  // 531
    // 18: 64-bit integer                                                                             // 532
    // 255: minkey                                                                                    // 533
    // 127: maxkey                                                                                    // 534
    if (ta === 13) // javascript code                                                                 // 535
      throw Error("Sorting not supported on Javascript code"); // XXX                                 // 536
    throw Error("Unknown type to sort");                                                              // 537
  }                                                                                                   // 538
};                                                                                                    // 539
                                                                                                      // 540
// For unit tests. True if the given document matches the given                                       // 541
// selector.                                                                                          // 542
LocalCollection._matches = function (selector, doc) {                                                 // 543
  return (LocalCollection._compileSelector(selector))(doc);                                           // 544
};                                                                                                    // 545
                                                                                                      // 546
// _makeLookupFunction(key) returns a lookup function.                                                // 547
//                                                                                                    // 548
// A lookup function takes in a document and returns an array of matching                             // 549
// values.  This array has more than one element if any segment of the key other                      // 550
// than the last one is an array.  ie, any arrays found when doing non-final                          // 551
// lookups result in this function "branching"; each element in the returned                          // 552
// array represents the value found at this branch. If any branch doesn't have a                      // 553
// final value for the full key, its element in the returned list will be                             // 554
// undefined. It always returns a non-empty array.                                                    // 555
//                                                                                                    // 556
// _makeLookupFunction('a.x')({a: {x: 1}}) returns [1]                                                // 557
// _makeLookupFunction('a.x')({a: {x: [1]}}) returns [[1]]                                            // 558
// _makeLookupFunction('a.x')({a: 5})  returns [undefined]                                            // 559
// _makeLookupFunction('a.x')({a: [{x: 1},                                                            // 560
//                                 {x: [2]},                                                          // 561
//                                 {y: 3}]})                                                          // 562
//   returns [1, [2], undefined]                                                                      // 563
LocalCollection._makeLookupFunction = function (key) {                                                // 564
  var dotLocation = key.indexOf('.');                                                                 // 565
  var first, lookupRest, nextIsNumeric;                                                               // 566
  if (dotLocation === -1) {                                                                           // 567
    first = key;                                                                                      // 568
  } else {                                                                                            // 569
    first = key.substr(0, dotLocation);                                                               // 570
    var rest = key.substr(dotLocation + 1);                                                           // 571
    lookupRest = LocalCollection._makeLookupFunction(rest);                                           // 572
    // Is the next (perhaps final) piece numeric (ie, an array lookup?)                               // 573
    nextIsNumeric = /^\d+(\.|$)/.test(rest);                                                          // 574
  }                                                                                                   // 575
                                                                                                      // 576
  return function (doc) {                                                                             // 577
    if (doc == null)  // null or undefined                                                            // 578
      return [undefined];                                                                             // 579
    var firstLevel = doc[first];                                                                      // 580
                                                                                                      // 581
    // We don't "branch" at the final level.                                                          // 582
    if (!lookupRest)                                                                                  // 583
      return [firstLevel];                                                                            // 584
                                                                                                      // 585
    // It's an empty array, and we're not done: we won't find anything.                               // 586
    if (isArray(firstLevel) && firstLevel.length === 0)                                               // 587
      return [undefined];                                                                             // 588
                                                                                                      // 589
    // For each result at this level, finish the lookup on the rest of the key,                       // 590
    // and return everything we find. Also, if the next result is a number,                           // 591
    // don't branch here.                                                                             // 592
    //                                                                                                // 593
    // Technically, in MongoDB, we should be able to handle the case where                            // 594
    // objects have numeric keys, but Mongo doesn't actually handle this                              // 595
    // consistently yet itself, see eg                                                                // 596
    // https://jira.mongodb.org/browse/SERVER-2898                                                    // 597
    // https://github.com/mongodb/mongo/blob/master/jstests/array_match2.js                           // 598
    if (!isArray(firstLevel) || nextIsNumeric)                                                        // 599
      firstLevel = [firstLevel];                                                                      // 600
    return Array.prototype.concat.apply([], _.map(firstLevel, lookupRest));                           // 601
  };                                                                                                  // 602
};                                                                                                    // 603
                                                                                                      // 604
// The main compilation function for a given selector.                                                // 605
var compileDocumentSelector = function (docSelector, cursor) {                                        // 606
  var perKeySelectors = [];                                                                           // 607
  _.each(docSelector, function (subSelector, key) {                                                   // 608
    if (key.substr(0, 1) === '$') {                                                                   // 609
      // Outer operators are either logical operators (they recurse back into                         // 610
      // this function), or $where.                                                                   // 611
      if (!_.has(LOGICAL_OPERATORS, key))                                                             // 612
        throw new Error("Unrecognized logical operator: " + key);                                     // 613
      perKeySelectors.push(                                                                           // 614
        LOGICAL_OPERATORS[key](subSelector, docSelector, cursor));                                    // 615
    } else {                                                                                          // 616
      var lookUpByIndex = LocalCollection._makeLookupFunction(key);                                   // 617
      var valueSelectorFunc =                                                                         // 618
        compileValueSelector(subSelector, docSelector, cursor);                                       // 619
      perKeySelectors.push(function (doc, wholeDoc) {                                                 // 620
        var branchValues = lookUpByIndex(doc);                                                        // 621
        // We apply the selector to each "branched" value and return true if any                      // 622
        // match. However, for "negative" selectors like $ne or $not we actually                      // 623
        // require *all* elements to match.                                                           // 624
        //                                                                                            // 625
        // This is because {'x.tag': {$ne: "foo"}} applied to {x: [{tag: 'foo'},                      // 626
        // {tag: 'bar'}]} should NOT match even though there is a branch that                         // 627
        // matches. (This matches the fact that $ne uses a negated                                    // 628
        // _anyIfArrayPlus, for when the last level of the key is the array,                          // 629
        // which deMorgans into an 'all'.)                                                            // 630
        //                                                                                            // 631
        // XXX This isn't 100% consistent with MongoDB in 'null' cases:                               // 632
        //     https://jira.mongodb.org/browse/SERVER-8585                                            // 633
        // XXX this still isn't right.  consider {a: {$ne: 5, $gt: 6}}. the                           // 634
        //     $ne needs to use the "all" logic and the $gt needs the "any"                           // 635
        //     logic                                                                                  // 636
        var combiner = (subSelector &&                                                                // 637
                        (subSelector.$not || subSelector.$ne ||                                       // 638
                         subSelector.$nin))                                                           // 639
              ? _.all : _.any;                                                                        // 640
        return combiner(branchValues, function (val) {                                                // 641
          return valueSelectorFunc(val, wholeDoc);                                                    // 642
        });                                                                                           // 643
      });                                                                                             // 644
    }                                                                                                 // 645
  });                                                                                                 // 646
                                                                                                      // 647
                                                                                                      // 648
  return function (doc, wholeDoc) {                                                                   // 649
    // If called w/o wholeDoc, doc is considered the original by default                              // 650
    if (wholeDoc === undefined)                                                                       // 651
      wholeDoc = doc;                                                                                 // 652
    return _.all(perKeySelectors, function (f) {                                                      // 653
      return f(doc, wholeDoc);                                                                        // 654
    });                                                                                               // 655
  };                                                                                                  // 656
};                                                                                                    // 657
                                                                                                      // 658
// Given a selector, return a function that takes one argument, a                                     // 659
// document, and returns true if the document matches the selector,                                   // 660
// else false.                                                                                        // 661
LocalCollection._compileSelector = function (selector, cursor) {                                      // 662
  // you can pass a literal function instead of a selector                                            // 663
  if (selector instanceof Function)                                                                   // 664
    return function (doc) {return selector.call(doc);};                                               // 665
                                                                                                      // 666
  // shorthand -- scalars match _id                                                                   // 667
  if (LocalCollection._selectorIsId(selector)) {                                                      // 668
    return function (doc) {                                                                           // 669
      return EJSON.equals(doc._id, selector);                                                         // 670
    };                                                                                                // 671
  }                                                                                                   // 672
                                                                                                      // 673
  // protect against dangerous selectors.  falsey and {_id: falsey} are both                          // 674
  // likely programmer error, and not what you want, particularly for                                 // 675
  // destructive operations.                                                                          // 676
  if (!selector || (('_id' in selector) && !selector._id))                                            // 677
    return function (doc) {return false;};                                                            // 678
                                                                                                      // 679
  // Top level can't be an array or true or binary.                                                   // 680
  if (typeof(selector) === 'boolean' || isArray(selector) ||                                          // 681
      EJSON.isBinary(selector))                                                                       // 682
    throw new Error("Invalid selector: " + selector);                                                 // 683
                                                                                                      // 684
  return compileDocumentSelector(selector, cursor);                                                   // 685
};                                                                                                    // 686
                                                                                                      // 687
// Give a sort spec, which can be in any of these forms:                                              // 688
//   {"key1": 1, "key2": -1}                                                                          // 689
//   [["key1", "asc"], ["key2", "desc"]]                                                              // 690
//   ["key1", ["key2", "desc"]]                                                                       // 691
//                                                                                                    // 692
// (.. with the first form being dependent on the key enumeration                                     // 693
// behavior of your javascript VM, which usually does what you mean in                                // 694
// this case if the key names don't look like integers ..)                                            // 695
//                                                                                                    // 696
// return a function that takes two objects, and returns -1 if the                                    // 697
// first object comes first in order, 1 if the second object comes                                    // 698
// first, or 0 if neither object comes before the other.                                              // 699
                                                                                                      // 700
LocalCollection._compileSort = function (spec, cursor) {                                              // 701
  var sortSpecParts = [];                                                                             // 702
                                                                                                      // 703
  if (spec instanceof Array) {                                                                        // 704
    for (var i = 0; i < spec.length; i++) {                                                           // 705
      if (typeof spec[i] === "string") {                                                              // 706
        sortSpecParts.push({                                                                          // 707
          lookup: LocalCollection._makeLookupFunction(spec[i]),                                       // 708
          ascending: true                                                                             // 709
        });                                                                                           // 710
      } else {                                                                                        // 711
        sortSpecParts.push({                                                                          // 712
          lookup: LocalCollection._makeLookupFunction(spec[i][0]),                                    // 713
          ascending: spec[i][1] !== "desc"                                                            // 714
        });                                                                                           // 715
      }                                                                                               // 716
    }                                                                                                 // 717
  } else if (typeof spec === "object") {                                                              // 718
    for (var key in spec) {                                                                           // 719
      sortSpecParts.push({                                                                            // 720
        lookup: LocalCollection._makeLookupFunction(key),                                             // 721
        ascending: spec[key] >= 0                                                                     // 722
      });                                                                                             // 723
    }                                                                                                 // 724
  } else {                                                                                            // 725
    throw Error("Bad sort specification: ", JSON.stringify(spec));                                    // 726
  }                                                                                                   // 727
                                                                                                      // 728
  // If there are no sorting rules specified, try to sort on _distance hidden                         // 729
  // fields on cursor we may acquire if query involved $near operator.                                // 730
  if (sortSpecParts.length === 0)                                                                     // 731
    return function (a, b) {                                                                          // 732
      if (!cursor || !cursor._distance)                                                               // 733
        return 0;                                                                                     // 734
      return cursor._distance[a._id] - cursor._distance[b._id];                                       // 735
    };                                                                                                // 736
                                                                                                      // 737
  // reduceValue takes in all the possible values for the sort key along various                      // 738
  // branches, and returns the min or max value (according to the bool                                // 739
  // findMin). Each value can itself be an array, and we look at its values                           // 740
  // too. (ie, we do a single level of flattening on branchValues, then find the                      // 741
  // min/max.)                                                                                        // 742
  var reduceValue = function (branchValues, findMin) {                                                // 743
    var reduced;                                                                                      // 744
    var first = true;                                                                                 // 745
    // Iterate over all the values found in all the branches, and if a value is                       // 746
    // an array itself, iterate over the values in the array separately.                              // 747
    _.each(branchValues, function (branchValue) {                                                     // 748
      // Value not an array? Pretend it is.                                                           // 749
      if (!isArray(branchValue))                                                                      // 750
        branchValue = [branchValue];                                                                  // 751
      // Value is an empty array? Pretend it was missing, since that's where it                       // 752
      // should be sorted.                                                                            // 753
      if (isArray(branchValue) && branchValue.length === 0)                                           // 754
        branchValue = [undefined];                                                                    // 755
      _.each(branchValue, function (value) {                                                          // 756
        // We should get here at least once: lookup functions return non-empty                        // 757
        // arrays, so the outer loop runs at least once, and we prevented                             // 758
        // branchValue from being an empty array.                                                     // 759
        if (first) {                                                                                  // 760
          reduced = value;                                                                            // 761
          first = false;                                                                              // 762
        } else {                                                                                      // 763
          // Compare the value we found to the value we found so far, saving it                       // 764
          // if it's less (for an ascending sort) or more (for a descending                           // 765
          // sort).                                                                                   // 766
          var cmp = LocalCollection._f._cmp(reduced, value);                                          // 767
          if ((findMin && cmp > 0) || (!findMin && cmp < 0))                                          // 768
            reduced = value;                                                                          // 769
        }                                                                                             // 770
      });                                                                                             // 771
    });                                                                                               // 772
    return reduced;                                                                                   // 773
  };                                                                                                  // 774
                                                                                                      // 775
  return function (a, b) {                                                                            // 776
    for (var i = 0; i < sortSpecParts.length; ++i) {                                                  // 777
      var specPart = sortSpecParts[i];                                                                // 778
      var aValue = reduceValue(specPart.lookup(a), specPart.ascending);                               // 779
      var bValue = reduceValue(specPart.lookup(b), specPart.ascending);                               // 780
      var compare = LocalCollection._f._cmp(aValue, bValue);                                          // 781
      if (compare !== 0)                                                                              // 782
        return specPart.ascending ? compare : -compare;                                               // 783
    };                                                                                                // 784
    return 0;                                                                                         // 785
  };                                                                                                  // 786
};                                                                                                    // 787
                                                                                                      // 788
                                                                                                      // 789
////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/minimongo/modify.js                                                                       //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
// XXX need a strategy for passing the binding of $ into this                                         // 1
// function, from the compiled selector                                                               // 2
//                                                                                                    // 3
// maybe just {key.up.to.just.before.dollarsign: array_index}                                         // 4
//                                                                                                    // 5
// XXX atomicity: if one modification fails, do we roll back the whole                                // 6
// change?                                                                                            // 7
//                                                                                                    // 8
// isInsert is set when _modify is being called to compute the document to                            // 9
// insert as part of an upsert operation. We use this primarily to figure out                         // 10
// when to set the fields in $setOnInsert, if present.                                                // 11
LocalCollection._modify = function (doc, mod, isInsert) {                                             // 12
  var is_modifier = false;                                                                            // 13
  for (var k in mod) {                                                                                // 14
    // IE7 doesn't support indexing into strings (eg, k[0]), so use substr.                           // 15
    // Too bad -- it's far slower:                                                                    // 16
    // http://jsperf.com/testing-the-first-character-of-a-string                                      // 17
    is_modifier = k.substr(0, 1) === '$';                                                             // 18
    break; // just check the first key.                                                               // 19
  }                                                                                                   // 20
                                                                                                      // 21
  var new_doc;                                                                                        // 22
                                                                                                      // 23
  if (!is_modifier) {                                                                                 // 24
    if (mod._id && !EJSON.equals(doc._id, mod._id))                                                   // 25
      throw Error("Cannot change the _id of a document");                                             // 26
                                                                                                      // 27
    // replace the whole document                                                                     // 28
    for (var k in mod) {                                                                              // 29
      if (k.substr(0, 1) === '$')                                                                     // 30
        throw Error("When replacing document, field name may not start with '$'");                    // 31
      if (/\./.test(k))                                                                               // 32
        throw Error("When replacing document, field name may not contain '.'");                       // 33
    }                                                                                                 // 34
    new_doc = mod;                                                                                    // 35
  } else {                                                                                            // 36
    // apply modifiers                                                                                // 37
    var new_doc = EJSON.clone(doc);                                                                   // 38
                                                                                                      // 39
    for (var op in mod) {                                                                             // 40
      var mod_func = LocalCollection._modifiers[op];                                                  // 41
      // Treat $setOnInsert as $set if this is an insert.                                             // 42
      if (isInsert && op === '$setOnInsert')                                                          // 43
        mod_func = LocalCollection._modifiers['$set'];                                                // 44
      if (!mod_func)                                                                                  // 45
        throw Error("Invalid modifier specified " + op);                                              // 46
      for (var keypath in mod[op]) {                                                                  // 47
        // XXX mongo doesn't allow mod field names to end in a period,                                // 48
        // but I don't see why.. it allows '' as a key, as does JS                                    // 49
        if (keypath.length && keypath[keypath.length-1] === '.')                                      // 50
          throw Error("Invalid mod field name, may not end in a period");                             // 51
                                                                                                      // 52
        var arg = mod[op][keypath];                                                                   // 53
        var keyparts = keypath.split('.');                                                            // 54
        var no_create = !!LocalCollection._noCreateModifiers[op];                                     // 55
        var forbid_array = (op === "$rename");                                                        // 56
        var target = LocalCollection._findModTarget(new_doc, keyparts,                                // 57
                                                    no_create, forbid_array);                         // 58
        var field = keyparts.pop();                                                                   // 59
        mod_func(target, field, arg, keypath, new_doc);                                               // 60
      }                                                                                               // 61
    }                                                                                                 // 62
  }                                                                                                   // 63
                                                                                                      // 64
  // move new document into place.                                                                    // 65
  _.each(_.keys(doc), function (k) {                                                                  // 66
    // Note: this used to be for (var k in doc) however, this does not                                // 67
    // work right in Opera. Deleting from a doc while iterating over it                               // 68
    // would sometimes cause opera to skip some keys.                                                 // 69
                                                                                                      // 70
    // isInsert: if we're constructing a document to insert (via upsert)                              // 71
    // and we're in replacement mode, not modify mode, DON'T take the                                 // 72
    // _id from the query.  This matches mongo's behavior.                                            // 73
    if (k !== '_id' || isInsert)                                                                      // 74
      delete doc[k];                                                                                  // 75
  });                                                                                                 // 76
  for (var k in new_doc) {                                                                            // 77
    doc[k] = new_doc[k];                                                                              // 78
  }                                                                                                   // 79
};                                                                                                    // 80
                                                                                                      // 81
// for a.b.c.2.d.e, keyparts should be ['a', 'b', 'c', '2', 'd', 'e'],                                // 82
// and then you would operate on the 'e' property of the returned                                     // 83
// object. if no_create is falsey, creates intermediate levels of                                     // 84
// structure as necessary, like mkdir -p (and raises an exception if                                  // 85
// that would mean giving a non-numeric property to an array.) if                                     // 86
// no_create is true, return undefined instead. may modify the last                                   // 87
// element of keyparts to signal to the caller that it needs to use a                                 // 88
// different value to index into the returned object (for example,                                    // 89
// ['a', '01'] -> ['a', 1]). if forbid_array is true, return null if                                  // 90
// the keypath goes through an array.                                                                 // 91
LocalCollection._findModTarget = function (doc, keyparts, no_create,                                  // 92
                                      forbid_array) {                                                 // 93
  for (var i = 0; i < keyparts.length; i++) {                                                         // 94
    var last = (i === keyparts.length - 1);                                                           // 95
    var keypart = keyparts[i];                                                                        // 96
    var numeric = /^[0-9]+$/.test(keypart);                                                           // 97
    if (no_create && (!(typeof doc === "object") || !(keypart in doc)))                               // 98
      return undefined;                                                                               // 99
    if (doc instanceof Array) {                                                                       // 100
      if (forbid_array)                                                                               // 101
        return null;                                                                                  // 102
      if (!numeric)                                                                                   // 103
        throw Error("can't append to array using string field name ["                                 // 104
                    + keypart + "]");                                                                 // 105
      keypart = parseInt(keypart);                                                                    // 106
      if (last)                                                                                       // 107
        // handle 'a.01'                                                                              // 108
        keyparts[i] = keypart;                                                                        // 109
      while (doc.length < keypart)                                                                    // 110
        doc.push(null);                                                                               // 111
      if (!last) {                                                                                    // 112
        if (doc.length === keypart)                                                                   // 113
          doc.push({});                                                                               // 114
        else if (typeof doc[keypart] !== "object")                                                    // 115
          throw Error("can't modify field '" + keyparts[i + 1] +                                      // 116
                      "' of list value " + JSON.stringify(doc[keypart]));                             // 117
      }                                                                                               // 118
    } else {                                                                                          // 119
      // XXX check valid fieldname (no $ at start, no .)                                              // 120
      if (!last && !(keypart in doc))                                                                 // 121
        doc[keypart] = {};                                                                            // 122
    }                                                                                                 // 123
                                                                                                      // 124
    if (last)                                                                                         // 125
      return doc;                                                                                     // 126
    doc = doc[keypart];                                                                               // 127
  }                                                                                                   // 128
                                                                                                      // 129
  // notreached                                                                                       // 130
};                                                                                                    // 131
                                                                                                      // 132
LocalCollection._noCreateModifiers = {                                                                // 133
  $unset: true,                                                                                       // 134
  $pop: true,                                                                                         // 135
  $rename: true,                                                                                      // 136
  $pull: true,                                                                                        // 137
  $pullAll: true                                                                                      // 138
};                                                                                                    // 139
                                                                                                      // 140
LocalCollection._modifiers = {                                                                        // 141
  $inc: function (target, field, arg) {                                                               // 142
    if (typeof arg !== "number")                                                                      // 143
      throw Error("Modifier $inc allowed for numbers only");                                          // 144
    if (field in target) {                                                                            // 145
      if (typeof target[field] !== "number")                                                          // 146
        throw Error("Cannot apply $inc modifier to non-number");                                      // 147
      target[field] += arg;                                                                           // 148
    } else {                                                                                          // 149
      target[field] = arg;                                                                            // 150
    }                                                                                                 // 151
  },                                                                                                  // 152
  $set: function (target, field, arg) {                                                               // 153
    if (field === '_id' && !EJSON.equals(arg, target._id))                                            // 154
      throw Error("Cannot change the _id of a document");                                             // 155
                                                                                                      // 156
    target[field] = EJSON.clone(arg);                                                                 // 157
  },                                                                                                  // 158
  $setOnInsert: function (target, field, arg) {                                                       // 159
    // converted to `$set` in `_modify`                                                               // 160
  },                                                                                                  // 161
  $unset: function (target, field, arg) {                                                             // 162
    if (target !== undefined) {                                                                       // 163
      if (target instanceof Array) {                                                                  // 164
        if (field in target)                                                                          // 165
          target[field] = null;                                                                       // 166
      } else                                                                                          // 167
        delete target[field];                                                                         // 168
    }                                                                                                 // 169
  },                                                                                                  // 170
  $push: function (target, field, arg) {                                                              // 171
    var x = target[field];                                                                            // 172
    if (x === undefined)                                                                              // 173
      target[field] = [arg];                                                                          // 174
    else if (!(x instanceof Array))                                                                   // 175
      throw Error("Cannot apply $push modifier to non-array");                                        // 176
    else                                                                                              // 177
      x.push(EJSON.clone(arg));                                                                       // 178
  },                                                                                                  // 179
  $pushAll: function (target, field, arg) {                                                           // 180
    if (!(typeof arg === "object" && arg instanceof Array))                                           // 181
      throw Error("Modifier $pushAll/pullAll allowed for arrays only");                               // 182
    var x = target[field];                                                                            // 183
    if (x === undefined)                                                                              // 184
      target[field] = arg;                                                                            // 185
    else if (!(x instanceof Array))                                                                   // 186
      throw Error("Cannot apply $pushAll modifier to non-array");                                     // 187
    else {                                                                                            // 188
      for (var i = 0; i < arg.length; i++)                                                            // 189
        x.push(arg[i]);                                                                               // 190
    }                                                                                                 // 191
  },                                                                                                  // 192
  $addToSet: function (target, field, arg) {                                                          // 193
    var x = target[field];                                                                            // 194
    if (x === undefined)                                                                              // 195
      target[field] = [arg];                                                                          // 196
    else if (!(x instanceof Array))                                                                   // 197
      throw Error("Cannot apply $addToSet modifier to non-array");                                    // 198
    else {                                                                                            // 199
      var isEach = false;                                                                             // 200
      if (typeof arg === "object") {                                                                  // 201
        for (var k in arg) {                                                                          // 202
          if (k === "$each")                                                                          // 203
            isEach = true;                                                                            // 204
          break;                                                                                      // 205
        }                                                                                             // 206
      }                                                                                               // 207
      var values = isEach ? arg["$each"] : [arg];                                                     // 208
      _.each(values, function (value) {                                                               // 209
        for (var i = 0; i < x.length; i++)                                                            // 210
          if (LocalCollection._f._equal(value, x[i]))                                                 // 211
            return;                                                                                   // 212
        x.push(value);                                                                                // 213
      });                                                                                             // 214
    }                                                                                                 // 215
  },                                                                                                  // 216
  $pop: function (target, field, arg) {                                                               // 217
    if (target === undefined)                                                                         // 218
      return;                                                                                         // 219
    var x = target[field];                                                                            // 220
    if (x === undefined)                                                                              // 221
      return;                                                                                         // 222
    else if (!(x instanceof Array))                                                                   // 223
      throw Error("Cannot apply $pop modifier to non-array");                                         // 224
    else {                                                                                            // 225
      if (typeof arg === 'number' && arg < 0)                                                         // 226
        x.splice(0, 1);                                                                               // 227
      else                                                                                            // 228
        x.pop();                                                                                      // 229
    }                                                                                                 // 230
  },                                                                                                  // 231
  $pull: function (target, field, arg) {                                                              // 232
    if (target === undefined)                                                                         // 233
      return;                                                                                         // 234
    var x = target[field];                                                                            // 235
    if (x === undefined)                                                                              // 236
      return;                                                                                         // 237
    else if (!(x instanceof Array))                                                                   // 238
      throw Error("Cannot apply $pull/pullAll modifier to non-array");                                // 239
    else {                                                                                            // 240
      var out = []                                                                                    // 241
      if (typeof arg === "object" && !(arg instanceof Array)) {                                       // 242
        // XXX would be much nicer to compile this once, rather than                                  // 243
        // for each document we modify.. but usually we're not                                        // 244
        // modifying that many documents, so we'll let it slide for                                   // 245
        // now                                                                                        // 246
                                                                                                      // 247
        // XXX _compileSelector isn't up for the job, because we need                                 // 248
        // to permit stuff like {$pull: {a: {$gt: 4}}}.. something                                    // 249
        // like {$gt: 4} is not normally a complete selector.                                         // 250
        // same issue as $elemMatch possibly?                                                         // 251
        var match = LocalCollection._compileSelector(arg);                                            // 252
        for (var i = 0; i < x.length; i++)                                                            // 253
          if (!match(x[i]))                                                                           // 254
            out.push(x[i])                                                                            // 255
      } else {                                                                                        // 256
        for (var i = 0; i < x.length; i++)                                                            // 257
          if (!LocalCollection._f._equal(x[i], arg))                                                  // 258
            out.push(x[i]);                                                                           // 259
      }                                                                                               // 260
      target[field] = out;                                                                            // 261
    }                                                                                                 // 262
  },                                                                                                  // 263
  $pullAll: function (target, field, arg) {                                                           // 264
    if (!(typeof arg === "object" && arg instanceof Array))                                           // 265
      throw Error("Modifier $pushAll/pullAll allowed for arrays only");                               // 266
    if (target === undefined)                                                                         // 267
      return;                                                                                         // 268
    var x = target[field];                                                                            // 269
    if (x === undefined)                                                                              // 270
      return;                                                                                         // 271
    else if (!(x instanceof Array))                                                                   // 272
      throw Error("Cannot apply $pull/pullAll modifier to non-array");                                // 273
    else {                                                                                            // 274
      var out = []                                                                                    // 275
      for (var i = 0; i < x.length; i++) {                                                            // 276
        var exclude = false;                                                                          // 277
        for (var j = 0; j < arg.length; j++) {                                                        // 278
          if (LocalCollection._f._equal(x[i], arg[j])) {                                              // 279
            exclude = true;                                                                           // 280
            break;                                                                                    // 281
          }                                                                                           // 282
        }                                                                                             // 283
        if (!exclude)                                                                                 // 284
          out.push(x[i]);                                                                             // 285
      }                                                                                               // 286
      target[field] = out;                                                                            // 287
    }                                                                                                 // 288
  },                                                                                                  // 289
  $rename: function (target, field, arg, keypath, doc) {                                              // 290
    if (keypath === arg)                                                                              // 291
      // no idea why mongo has this restriction..                                                     // 292
      throw Error("$rename source must differ from target");                                          // 293
    if (target === null)                                                                              // 294
      throw Error("$rename source field invalid");                                                    // 295
    if (typeof arg !== "string")                                                                      // 296
      throw Error("$rename target must be a string");                                                 // 297
    if (target === undefined)                                                                         // 298
      return;                                                                                         // 299
    var v = target[field];                                                                            // 300
    delete target[field];                                                                             // 301
                                                                                                      // 302
    var keyparts = arg.split('.');                                                                    // 303
    var target2 = LocalCollection._findModTarget(doc, keyparts, false, true);                         // 304
    if (target2 === null)                                                                             // 305
      throw Error("$rename target field invalid");                                                    // 306
    var field2 = keyparts.pop();                                                                      // 307
    target2[field2] = v;                                                                              // 308
  },                                                                                                  // 309
  $bit: function (target, field, arg) {                                                               // 310
    // XXX mongo only supports $bit on integers, and we only support                                  // 311
    // native javascript numbers (doubles) so far, so we can't support $bit                           // 312
    throw Error("$bit is not supported");                                                             // 313
  }                                                                                                   // 314
};                                                                                                    // 315
                                                                                                      // 316
LocalCollection._removeDollarOperators = function (selector) {                                        // 317
  var selectorDoc = {};                                                                               // 318
  for (var k in selector)                                                                             // 319
    if (k.substr(0, 1) !== '$')                                                                       // 320
      selectorDoc[k] = selector[k];                                                                   // 321
  return selectorDoc;                                                                                 // 322
};                                                                                                    // 323
                                                                                                      // 324
////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/minimongo/diff.js                                                                         //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
                                                                                                      // 1
// ordered: bool.                                                                                     // 2
// old_results and new_results: collections of documents.                                             // 3
//    if ordered, they are arrays.                                                                    // 4
//    if unordered, they are maps {_id: doc}.                                                         // 5
// observer: object with 'added', 'changed', 'removed',                                               // 6
//           and (if ordered) 'moved' functions (each optional)                                       // 7
LocalCollection._diffQueryChanges = function (ordered, oldResults, newResults,                        // 8
                                       observer) {                                                    // 9
  if (ordered)                                                                                        // 10
    LocalCollection._diffQueryOrderedChanges(                                                         // 11
      oldResults, newResults, observer);                                                              // 12
  else                                                                                                // 13
    LocalCollection._diffQueryUnorderedChanges(                                                       // 14
      oldResults, newResults, observer);                                                              // 15
};                                                                                                    // 16
                                                                                                      // 17
LocalCollection._diffQueryUnorderedChanges = function (oldResults, newResults,                        // 18
                                                observer) {                                           // 19
  if (observer.moved) {                                                                               // 20
    throw new Error("_diffQueryUnordered called with a moved observer!");                             // 21
  }                                                                                                   // 22
                                                                                                      // 23
  _.each(newResults, function (newDoc) {                                                              // 24
    if (_.has(oldResults, newDoc._id)) {                                                              // 25
      var oldDoc = oldResults[newDoc._id];                                                            // 26
      if (observer.changed && !EJSON.equals(oldDoc, newDoc)) {                                        // 27
        observer.changed(newDoc._id, LocalCollection._makeChangedFields(newDoc, oldDoc));             // 28
      }                                                                                               // 29
    } else {                                                                                          // 30
      var fields = EJSON.clone(newDoc);                                                               // 31
      delete fields._id;                                                                              // 32
      observer.added && observer.added(newDoc._id, fields);                                           // 33
    }                                                                                                 // 34
  });                                                                                                 // 35
                                                                                                      // 36
  if (observer.removed) {                                                                             // 37
    _.each(oldResults, function (oldDoc) {                                                            // 38
      if (!_.has(newResults, oldDoc._id))                                                             // 39
        observer.removed(oldDoc._id);                                                                 // 40
    });                                                                                               // 41
  }                                                                                                   // 42
};                                                                                                    // 43
                                                                                                      // 44
                                                                                                      // 45
LocalCollection._diffQueryOrderedChanges = function (old_results, new_results, observer) {            // 46
                                                                                                      // 47
  var new_presence_of_id = {};                                                                        // 48
  _.each(new_results, function (doc) {                                                                // 49
    if (new_presence_of_id[doc._id])                                                                  // 50
      Meteor._debug("Duplicate _id in new_results");                                                  // 51
    new_presence_of_id[doc._id] = true;                                                               // 52
  });                                                                                                 // 53
                                                                                                      // 54
  var old_index_of_id = {};                                                                           // 55
  _.each(old_results, function (doc, i) {                                                             // 56
    if (doc._id in old_index_of_id)                                                                   // 57
      Meteor._debug("Duplicate _id in old_results");                                                  // 58
    old_index_of_id[doc._id] = i;                                                                     // 59
  });                                                                                                 // 60
                                                                                                      // 61
  // ALGORITHM:                                                                                       // 62
  //                                                                                                  // 63
  // To determine which docs should be considered "moved" (and which                                  // 64
  // merely change position because of other docs moving) we run                                      // 65
  // a "longest common subsequence" (LCS) algorithm.  The LCS of the                                  // 66
  // old doc IDs and the new doc IDs gives the docs that should NOT be                                // 67
  // considered moved.                                                                                // 68
                                                                                                      // 69
  // To actually call the appropriate callbacks to get from the old state to the                      // 70
  // new state:                                                                                       // 71
                                                                                                      // 72
  // First, we call removed() on all the items that only appear in the old                            // 73
  // state.                                                                                           // 74
                                                                                                      // 75
  // Then, once we have the items that should not move, we walk through the new                       // 76
  // results array group-by-group, where a "group" is a set of items that have                        // 77
  // moved, anchored on the end by an item that should not move.  One by one, we                      // 78
  // move each of those elements into place "before" the anchoring end-of-group                       // 79
  // item, and fire changed events on them if necessary.  Then we fire a changed                      // 80
  // event on the anchor, and move on to the next group.  There is always at                          // 81
  // least one group; the last group is anchored by a virtual "null" id at the                        // 82
  // end.                                                                                             // 83
                                                                                                      // 84
  // Asymptotically: O(N k) where k is number of ops, or potentially                                  // 85
  // O(N log N) if inner loop of LCS were made to be binary search.                                   // 86
                                                                                                      // 87
                                                                                                      // 88
  //////// LCS (longest common sequence, with respect to _id)                                         // 89
  // (see Wikipedia article on Longest Increasing Subsequence,                                        // 90
  // where the LIS is taken of the sequence of old indices of the                                     // 91
  // docs in new_results)                                                                             // 92
  //                                                                                                  // 93
  // unmoved: the output of the algorithm; members of the LCS,                                        // 94
  // in the form of indices into new_results                                                          // 95
  var unmoved = [];                                                                                   // 96
  // max_seq_len: length of LCS found so far                                                          // 97
  var max_seq_len = 0;                                                                                // 98
  // seq_ends[i]: the index into new_results of the last doc in a                                     // 99
  // common subsequence of length of i+1 <= max_seq_len                                               // 100
  var N = new_results.length;                                                                         // 101
  var seq_ends = new Array(N);                                                                        // 102
  // ptrs:  the common subsequence ending with new_results[n] extends                                 // 103
  // a common subsequence ending with new_results[ptr[n]], unless                                     // 104
  // ptr[n] is -1.                                                                                    // 105
  var ptrs = new Array(N);                                                                            // 106
  // virtual sequence of old indices of new results                                                   // 107
  var old_idx_seq = function(i_new) {                                                                 // 108
    return old_index_of_id[new_results[i_new]._id];                                                   // 109
  };                                                                                                  // 110
  // for each item in new_results, use it to extend a common subsequence                              // 111
  // of length j <= max_seq_len                                                                       // 112
  for(var i=0; i<N; i++) {                                                                            // 113
    if (old_index_of_id[new_results[i]._id] !== undefined) {                                          // 114
      var j = max_seq_len;                                                                            // 115
      // this inner loop would traditionally be a binary search,                                      // 116
      // but scanning backwards we will likely find a subseq to extend                                // 117
      // pretty soon, bounded for example by the total number of ops.                                 // 118
      // If this were to be changed to a binary search, we'd still want                               // 119
      // to scan backwards a bit as an optimization.                                                  // 120
      while (j > 0) {                                                                                 // 121
        if (old_idx_seq(seq_ends[j-1]) < old_idx_seq(i))                                              // 122
          break;                                                                                      // 123
        j--;                                                                                          // 124
      }                                                                                               // 125
                                                                                                      // 126
      ptrs[i] = (j === 0 ? -1 : seq_ends[j-1]);                                                       // 127
      seq_ends[j] = i;                                                                                // 128
      if (j+1 > max_seq_len)                                                                          // 129
        max_seq_len = j+1;                                                                            // 130
    }                                                                                                 // 131
  }                                                                                                   // 132
                                                                                                      // 133
  // pull out the LCS/LIS into unmoved                                                                // 134
  var idx = (max_seq_len === 0 ? -1 : seq_ends[max_seq_len-1]);                                       // 135
  while (idx >= 0) {                                                                                  // 136
    unmoved.push(idx);                                                                                // 137
    idx = ptrs[idx];                                                                                  // 138
  }                                                                                                   // 139
  // the unmoved item list is built backwards, so fix that                                            // 140
  unmoved.reverse();                                                                                  // 141
                                                                                                      // 142
  // the last group is always anchored by the end of the result list, which is                        // 143
  // an id of "null"                                                                                  // 144
  unmoved.push(new_results.length);                                                                   // 145
                                                                                                      // 146
  _.each(old_results, function (doc) {                                                                // 147
    if (!new_presence_of_id[doc._id])                                                                 // 148
      observer.removed && observer.removed(doc._id);                                                  // 149
  });                                                                                                 // 150
  // for each group of things in the new_results that is anchored by an unmoved                       // 151
  // element, iterate through the things before it.                                                   // 152
  var startOfGroup = 0;                                                                               // 153
  _.each(unmoved, function (endOfGroup) {                                                             // 154
    var groupId = new_results[endOfGroup] ? new_results[endOfGroup]._id : null;                       // 155
    var oldDoc;                                                                                       // 156
    var newDoc;                                                                                       // 157
    var fields;                                                                                       // 158
    for (var i = startOfGroup; i < endOfGroup; i++) {                                                 // 159
      newDoc = new_results[i];                                                                        // 160
      if (!_.has(old_index_of_id, newDoc._id)) {                                                      // 161
        fields = EJSON.clone(newDoc);                                                                 // 162
        delete fields._id;                                                                            // 163
        observer.addedBefore && observer.addedBefore(newDoc._id, fields, groupId);                    // 164
        observer.added && observer.added(newDoc._id, fields);                                         // 165
      } else {                                                                                        // 166
        // moved                                                                                      // 167
        oldDoc = old_results[old_index_of_id[newDoc._id]];                                            // 168
        fields = LocalCollection._makeChangedFields(newDoc, oldDoc);                                  // 169
        if (!_.isEmpty(fields)) {                                                                     // 170
          observer.changed && observer.changed(newDoc._id, fields);                                   // 171
        }                                                                                             // 172
        observer.movedBefore && observer.movedBefore(newDoc._id, groupId);                            // 173
      }                                                                                               // 174
    }                                                                                                 // 175
    if (groupId) {                                                                                    // 176
      newDoc = new_results[endOfGroup];                                                               // 177
      oldDoc = old_results[old_index_of_id[newDoc._id]];                                              // 178
      fields = LocalCollection._makeChangedFields(newDoc, oldDoc);                                    // 179
      if (!_.isEmpty(fields)) {                                                                       // 180
        observer.changed && observer.changed(newDoc._id, fields);                                     // 181
      }                                                                                               // 182
    }                                                                                                 // 183
    startOfGroup = endOfGroup+1;                                                                      // 184
  });                                                                                                 // 185
                                                                                                      // 186
                                                                                                      // 187
};                                                                                                    // 188
                                                                                                      // 189
                                                                                                      // 190
// General helper for diff-ing two objects.                                                           // 191
// callbacks is an object like so:                                                                    // 192
// { leftOnly: function (key, leftValue) {...},                                                       // 193
//   rightOnly: function (key, rightValue) {...},                                                     // 194
//   both: function (key, leftValue, rightValue) {...},                                               // 195
// }                                                                                                  // 196
LocalCollection._diffObjects = function (left, right, callbacks) {                                    // 197
  _.each(left, function (leftValue, key) {                                                            // 198
    if (_.has(right, key))                                                                            // 199
      callbacks.both && callbacks.both(key, leftValue, right[key]);                                   // 200
    else                                                                                              // 201
      callbacks.leftOnly && callbacks.leftOnly(key, leftValue);                                       // 202
  });                                                                                                 // 203
  if (callbacks.rightOnly) {                                                                          // 204
    _.each(right, function(rightValue, key) {                                                         // 205
      if (!_.has(left, key))                                                                          // 206
        callbacks.rightOnly(key, rightValue);                                                         // 207
    });                                                                                               // 208
  }                                                                                                   // 209
};                                                                                                    // 210
                                                                                                      // 211
////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/minimongo/objectid.js                                                                     //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
LocalCollection._looksLikeObjectID = function (str) {                                                 // 1
  return str.length === 24 && str.match(/^[0-9a-f]*$/);                                               // 2
};                                                                                                    // 3
                                                                                                      // 4
LocalCollection._ObjectID = function (hexString) {                                                    // 5
  //random-based impl of Mongo ObjectID                                                               // 6
  var self = this;                                                                                    // 7
  if (hexString) {                                                                                    // 8
    hexString = hexString.toLowerCase();                                                              // 9
    if (!LocalCollection._looksLikeObjectID(hexString)) {                                             // 10
      throw new Error("Invalid hexadecimal string for creating an ObjectID");                         // 11
    }                                                                                                 // 12
    // meant to work with _.isEqual(), which relies on structural equality                            // 13
    self._str = hexString;                                                                            // 14
  } else {                                                                                            // 15
    self._str = Random.hexString(24);                                                                 // 16
  }                                                                                                   // 17
};                                                                                                    // 18
                                                                                                      // 19
LocalCollection._ObjectID.prototype.toString = function () {                                          // 20
  var self = this;                                                                                    // 21
  return "ObjectID(\"" + self._str + "\")";                                                           // 22
};                                                                                                    // 23
                                                                                                      // 24
LocalCollection._ObjectID.prototype.equals = function (other) {                                       // 25
  var self = this;                                                                                    // 26
  return other instanceof LocalCollection._ObjectID &&                                                // 27
    self.valueOf() === other.valueOf();                                                               // 28
};                                                                                                    // 29
                                                                                                      // 30
LocalCollection._ObjectID.prototype.clone = function () {                                             // 31
  var self = this;                                                                                    // 32
  return new LocalCollection._ObjectID(self._str);                                                    // 33
};                                                                                                    // 34
                                                                                                      // 35
LocalCollection._ObjectID.prototype.typeName = function() {                                           // 36
  return "oid";                                                                                       // 37
};                                                                                                    // 38
                                                                                                      // 39
LocalCollection._ObjectID.prototype.getTimestamp = function() {                                       // 40
  var self = this;                                                                                    // 41
  return parseInt(self._str.substr(0, 8), 16);                                                        // 42
};                                                                                                    // 43
                                                                                                      // 44
LocalCollection._ObjectID.prototype.valueOf =                                                         // 45
    LocalCollection._ObjectID.prototype.toJSONValue =                                                 // 46
    LocalCollection._ObjectID.prototype.toHexString =                                                 // 47
    function () { return this._str; };                                                                // 48
                                                                                                      // 49
// Is this selector just shorthand for lookup by _id?                                                 // 50
LocalCollection._selectorIsId = function (selector) {                                                 // 51
  return (typeof selector === "string") ||                                                            // 52
    (typeof selector === "number") ||                                                                 // 53
    selector instanceof LocalCollection._ObjectID;                                                    // 54
};                                                                                                    // 55
                                                                                                      // 56
// Is the selector just lookup by _id (shorthand or not)?                                             // 57
LocalCollection._selectorIsIdPerhapsAsObject = function (selector) {                                  // 58
  return LocalCollection._selectorIsId(selector) ||                                                   // 59
    (selector && typeof selector === "object" &&                                                      // 60
     selector._id && LocalCollection._selectorIsId(selector._id) &&                                   // 61
     _.size(selector) === 1);                                                                         // 62
};                                                                                                    // 63
                                                                                                      // 64
// If this is a selector which explicitly constrains the match by ID to a finite                      // 65
// number of documents, returns a list of their IDs.  Otherwise returns                               // 66
// null. Note that the selector may have other restrictions so it may not even                        // 67
// match those document!  We care about $in and $and since those are generated                        // 68
// access-controlled update and remove.                                                               // 69
LocalCollection._idsMatchedBySelector = function (selector) {                                         // 70
  // Is the selector just an ID?                                                                      // 71
  if (LocalCollection._selectorIsId(selector))                                                        // 72
    return [selector];                                                                                // 73
  if (!selector)                                                                                      // 74
    return null;                                                                                      // 75
                                                                                                      // 76
  // Do we have an _id clause?                                                                        // 77
  if (_.has(selector, '_id')) {                                                                       // 78
    // Is the _id clause just an ID?                                                                  // 79
    if (LocalCollection._selectorIsId(selector._id))                                                  // 80
      return [selector._id];                                                                          // 81
    // Is the _id clause {_id: {$in: ["x", "y", "z"]}}?                                               // 82
    if (selector._id && selector._id.$in                                                              // 83
        && _.isArray(selector._id.$in)                                                                // 84
        && !_.isEmpty(selector._id.$in)                                                               // 85
        && _.all(selector._id.$in, LocalCollection._selectorIsId)) {                                  // 86
      return selector._id.$in;                                                                        // 87
    }                                                                                                 // 88
    return null;                                                                                      // 89
  }                                                                                                   // 90
                                                                                                      // 91
  // If this is a top-level $and, and any of the clauses constrain their                              // 92
  // documents, then the whole selector is constrained by any one clause's                            // 93
  // constraint. (Well, by their intersection, but that seems unlikely.)                              // 94
  if (selector.$and && _.isArray(selector.$and)) {                                                    // 95
    for (var i = 0; i < selector.$and.length; ++i) {                                                  // 96
      var subIds = LocalCollection._idsMatchedBySelector(selector.$and[i]);                           // 97
      if (subIds)                                                                                     // 98
        return subIds;                                                                                // 99
    }                                                                                                 // 100
  }                                                                                                   // 101
                                                                                                      // 102
  return null;                                                                                        // 103
};                                                                                                    // 104
                                                                                                      // 105
EJSON.addType("oid",  function (str) {                                                                // 106
  return new LocalCollection._ObjectID(str);                                                          // 107
});                                                                                                   // 108
                                                                                                      // 109
////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.minimongo = {
  LocalCollection: LocalCollection
};

})();
