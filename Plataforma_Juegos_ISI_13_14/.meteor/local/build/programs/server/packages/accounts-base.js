(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var _ = Package.underscore._;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var DDP = Package.livedata.DDP;
var DDPServer = Package.livedata.DDPServer;
var MongoInternals = Package['mongo-livedata'].MongoInternals;

/* Package-scope variables */
var Accounts, EXPIRE_TOKENS_INTERVAL_MS, CONNECTION_CLOSE_DELAY_MS, getTokenLifetimeMs, loginHandlers, maybeStopExpireTokensInterval;

(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/accounts-base/accounts_common.js                                                                     //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
Accounts = {};                                                                                                   // 1
                                                                                                                 // 2
// Currently this is read directly by packages like accounts-password                                            // 3
// and accounts-ui-unstyled.                                                                                     // 4
Accounts._options = {};                                                                                          // 5
                                                                                                                 // 6
// how long (in days) until a login token expires                                                                // 7
var DEFAULT_LOGIN_EXPIRATION_DAYS = 90;                                                                          // 8
// Clients don't try to auto-login with a token that is going to expire within                                   // 9
// .1 * DEFAULT_LOGIN_EXPIRATION_DAYS, capped at MIN_TOKEN_LIFETIME_CAP_SECS.                                    // 10
// Tries to avoid abrupt disconnects from expiring tokens.                                                       // 11
var MIN_TOKEN_LIFETIME_CAP_SECS = 3600; // one hour                                                              // 12
// how often (in milliseconds) we check for expired tokens                                                       // 13
EXPIRE_TOKENS_INTERVAL_MS = 600 * 1000; // 10 minutes                                                            // 14
// how long we wait before logging out clients when Meteor.logoutOtherClients is                                 // 15
// called                                                                                                        // 16
CONNECTION_CLOSE_DELAY_MS = 10 * 1000;                                                                           // 17
                                                                                                                 // 18
// Set up config for the accounts system. Call this on both the client                                           // 19
// and the server.                                                                                               // 20
//                                                                                                               // 21
// XXX we should add some enforcement that this is called on both the                                            // 22
// client and the server. Otherwise, a user can                                                                  // 23
// 'forbidClientAccountCreation' only on the client and while it looks                                           // 24
// like their app is secure, the server will still accept createUser                                             // 25
// calls. https://github.com/meteor/meteor/issues/828                                                            // 26
//                                                                                                               // 27
// @param options {Object} an object with fields:                                                                // 28
// - sendVerificationEmail {Boolean}                                                                             // 29
//     Send email address verification emails to new users created from                                          // 30
//     client signups.                                                                                           // 31
// - forbidClientAccountCreation {Boolean}                                                                       // 32
//     Do not allow clients to create accounts directly.                                                         // 33
// - restrictCreationByEmailDomain {Function or String}                                                          // 34
//     Require created users to have an email matching the function or                                           // 35
//     having the string as domain.                                                                              // 36
// - loginExpirationInDays {Number}                                                                              // 37
//     Number of days since login until a user is logged out (login token                                        // 38
//     expires).                                                                                                 // 39
//                                                                                                               // 40
Accounts.config = function(options) {                                                                            // 41
  // We don't want users to accidentally only call Accounts.config on the                                        // 42
  // client, where some of the options will have partial effects (eg removing                                    // 43
  // the "create account" button from accounts-ui if forbidClientAccountCreation                                 // 44
  // is set, or redirecting Google login to a specific-domain page) without                                      // 45
  // having their full effects.                                                                                  // 46
  if (Meteor.isServer) {                                                                                         // 47
    __meteor_runtime_config__.accountsConfigCalled = true;                                                       // 48
  } else if (!__meteor_runtime_config__.accountsConfigCalled) {                                                  // 49
    // XXX would be nice to "crash" the client and replace the UI with an error                                  // 50
    // message, but there's no trivial way to do this.                                                           // 51
    Meteor._debug("Accounts.config was called on the client but not on the " +                                   // 52
                  "server; some configuration options may not take effect.");                                    // 53
  }                                                                                                              // 54
                                                                                                                 // 55
  // validate option keys                                                                                        // 56
  var VALID_KEYS = ["sendVerificationEmail", "forbidClientAccountCreation",                                      // 57
                    "restrictCreationByEmailDomain", "loginExpirationInDays"];                                   // 58
  _.each(_.keys(options), function (key) {                                                                       // 59
    if (!_.contains(VALID_KEYS, key)) {                                                                          // 60
      throw new Error("Accounts.config: Invalid key: " + key);                                                   // 61
    }                                                                                                            // 62
  });                                                                                                            // 63
                                                                                                                 // 64
  // set values in Accounts._options                                                                             // 65
  _.each(VALID_KEYS, function (key) {                                                                            // 66
    if (key in options) {                                                                                        // 67
      if (key in Accounts._options) {                                                                            // 68
        throw new Error("Can't set `" + key + "` more than once");                                               // 69
      } else {                                                                                                   // 70
        Accounts._options[key] = options[key];                                                                   // 71
      }                                                                                                          // 72
    }                                                                                                            // 73
  });                                                                                                            // 74
                                                                                                                 // 75
  // If the user set loginExpirationInDays to null, then we need to clear the                                    // 76
  // timer that periodically expires tokens.                                                                     // 77
  if (Meteor.isServer)                                                                                           // 78
    maybeStopExpireTokensInterval();                                                                             // 79
};                                                                                                               // 80
                                                                                                                 // 81
// Users table. Don't use the normal autopublish, since we want to hide                                          // 82
// some fields. Code to autopublish this is in accounts_server.js.                                               // 83
// XXX Allow users to configure this collection name.                                                            // 84
//                                                                                                               // 85
Meteor.users = new Meteor.Collection("users", {_preventAutopublish: true});                                      // 86
// There is an allow call in accounts_server that restricts this                                                 // 87
// collection.                                                                                                   // 88
                                                                                                                 // 89
// loginServiceConfiguration and ConfigError are maintained for backwards compatibility                          // 90
Accounts.loginServiceConfiguration = ServiceConfiguration.configurations;                                        // 91
Accounts.ConfigError = ServiceConfiguration.ConfigError;                                                         // 92
                                                                                                                 // 93
// Thrown when the user cancels the login process (eg, closes an oauth                                           // 94
// popup, declines retina scan, etc)                                                                             // 95
Accounts.LoginCancelledError = function(description) {                                                           // 96
  this.message = description;                                                                                    // 97
};                                                                                                               // 98
                                                                                                                 // 99
// This is used to transmit specific subclass errors over the wire. We should                                    // 100
// come up with a more generic way to do this (eg, with some sort of symbolic                                    // 101
// error code rather than a number).                                                                             // 102
Accounts.LoginCancelledError.numericError = 0x8acdc2f;                                                           // 103
Accounts.LoginCancelledError.prototype = new Error();                                                            // 104
Accounts.LoginCancelledError.prototype.name = 'Accounts.LoginCancelledError';                                    // 105
                                                                                                                 // 106
getTokenLifetimeMs = function () {                                                                               // 107
  return (Accounts._options.loginExpirationInDays ||                                                             // 108
          DEFAULT_LOGIN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;                                                  // 109
};                                                                                                               // 110
                                                                                                                 // 111
Accounts._tokenExpiration = function (when) {                                                                    // 112
  // We pass when through the Date constructor for backwards compatibility;                                      // 113
  // `when` used to be a number.                                                                                 // 114
  return new Date((new Date(when)).getTime() + getTokenLifetimeMs());                                            // 115
};                                                                                                               // 116
                                                                                                                 // 117
Accounts._tokenExpiresSoon = function (when) {                                                                   // 118
  var minLifetimeMs = .1 * getTokenLifetimeMs();                                                                 // 119
  var minLifetimeCapMs = MIN_TOKEN_LIFETIME_CAP_SECS * 1000;                                                     // 120
  if (minLifetimeMs > minLifetimeCapMs)                                                                          // 121
    minLifetimeMs = minLifetimeCapMs;                                                                            // 122
  return new Date() > (new Date(when) - minLifetimeMs);                                                          // 123
};                                                                                                               // 124
                                                                                                                 // 125
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/accounts-base/accounts_server.js                                                                     //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
///                                                                                                              // 1
/// CURRENT USER                                                                                                 // 2
///                                                                                                              // 3
                                                                                                                 // 4
Meteor.userId = function () {                                                                                    // 5
  // This function only works if called inside a method. In theory, it                                           // 6
  // could also be called from publish statements, since they also                                               // 7
  // have a userId associated with them. However, given that publish                                             // 8
  // functions aren't reactive, using any of the infomation from                                                 // 9
  // Meteor.user() in a publish function will always use the value                                               // 10
  // from when the function first runs. This is likely not what the                                              // 11
  // user expects. The way to make this work in a publish is to do                                               // 12
  // Meteor.find(this.userId()).observe and recompute when the user                                              // 13
  // record changes.                                                                                             // 14
  var currentInvocation = DDP._CurrentInvocation.get();                                                          // 15
  if (!currentInvocation)                                                                                        // 16
    throw new Error("Meteor.userId can only be invoked in method calls. Use this.userId in publish functions."); // 17
  return currentInvocation.userId;                                                                               // 18
};                                                                                                               // 19
                                                                                                                 // 20
Meteor.user = function () {                                                                                      // 21
  var userId = Meteor.userId();                                                                                  // 22
  if (!userId)                                                                                                   // 23
    return null;                                                                                                 // 24
  return Meteor.users.findOne(userId);                                                                           // 25
};                                                                                                               // 26
                                                                                                                 // 27
///                                                                                                              // 28
/// LOGIN HANDLERS                                                                                               // 29
///                                                                                                              // 30
                                                                                                                 // 31
// The main entry point for auth packages to hook in to login.                                                   // 32
//                                                                                                               // 33
// @param handler {Function} A function that receives an options object                                          // 34
// (as passed as an argument to the `login` method) and returns one of:                                          // 35
// - `undefined`, meaning don't handle;                                                                          // 36
// - {id: userId, token: *, tokenExpires: *}, if the user logged in                                              // 37
//   successfully. tokenExpires is optional and intends to provide a hint to the                                 // 38
//   client as to when the token will expire. If not provided, the client will                                   // 39
//   call Accounts._tokenExpiration, passing it the date that it received the                                    // 40
//   token.                                                                                                      // 41
// - throw an error, if the user failed to log in.                                                               // 42
//                                                                                                               // 43
Accounts.registerLoginHandler = function(handler) {                                                              // 44
  loginHandlers.push(handler);                                                                                   // 45
};                                                                                                               // 46
                                                                                                                 // 47
// list of all registered handlers.                                                                              // 48
loginHandlers = [];                                                                                              // 49
                                                                                                                 // 50
                                                                                                                 // 51
// Try all of the registered login handlers until one of them doesn'                                             // 52
// return `undefined`, meaning it handled this call to `login`. Return                                           // 53
// that return value, which ought to be a {id/token} pair.                                                       // 54
var tryAllLoginHandlers = function (options) {                                                                   // 55
  for (var i = 0; i < loginHandlers.length; ++i) {                                                               // 56
    var handler = loginHandlers[i];                                                                              // 57
    var result = handler(options);                                                                               // 58
    if (result !== undefined)                                                                                    // 59
      return result;                                                                                             // 60
  }                                                                                                              // 61
                                                                                                                 // 62
  throw new Meteor.Error(400, "Unrecognized options for login request");                                         // 63
};                                                                                                               // 64
                                                                                                                 // 65
                                                                                                                 // 66
// Actual methods for login and logout. This is the entry point for                                              // 67
// clients to actually log in.                                                                                   // 68
Meteor.methods({                                                                                                 // 69
  // @returns {Object|null}                                                                                      // 70
  //   If successful, returns {token: reconnectToken, id: userId}                                                // 71
  //   If unsuccessful (for example, if the user closed the oauth login popup),                                  // 72
  //     returns null                                                                                            // 73
  login: function(options) {                                                                                     // 74
    // Login handlers should really also check whatever field they look at in                                    // 75
    // options, but we don't enforce it.                                                                         // 76
    check(options, Object);                                                                                      // 77
    var result = tryAllLoginHandlers(options);                                                                   // 78
    if (result !== null) {                                                                                       // 79
      this.setUserId(result.id);                                                                                 // 80
      this._setLoginToken(result.token);                                                                         // 81
    }                                                                                                            // 82
    return result;                                                                                               // 83
  },                                                                                                             // 84
                                                                                                                 // 85
  logout: function() {                                                                                           // 86
    var token = this._getLoginToken();                                                                           // 87
    this._setLoginToken(null);                                                                                   // 88
    if (token && this.userId)                                                                                    // 89
      removeLoginToken(this.userId, token);                                                                      // 90
    this.setUserId(null);                                                                                        // 91
  },                                                                                                             // 92
                                                                                                                 // 93
  // Delete all the current user's tokens and close all open connections logged                                  // 94
  // in as this user. Returns a fresh new login token that this client can                                       // 95
  // use. Tests set Accounts._noConnectionCloseDelayForTest to delete tokens                                     // 96
  // immediately instead of using a delay.                                                                       // 97
  //                                                                                                             // 98
  // @returns {Object} Object with token and tokenExpires keys.                                                  // 99
  logoutOtherClients: function () {                                                                              // 100
    var self = this;                                                                                             // 101
    var user = Meteor.users.findOne(self.userId, {                                                               // 102
      fields: {                                                                                                  // 103
        "services.resume.loginTokens": true                                                                      // 104
      }                                                                                                          // 105
    });                                                                                                          // 106
    if (user) {                                                                                                  // 107
      // Save the current tokens in the database to be deleted in                                                // 108
      // CONNECTION_CLOSE_DELAY_MS ms. This gives other connections in the                                       // 109
      // caller's browser time to find the fresh token in localStorage. We save                                  // 110
      // the tokens in the database in case we crash before actually deleting                                    // 111
      // them.                                                                                                   // 112
      var tokens = user.services.resume.loginTokens;                                                             // 113
      var newToken = Accounts._generateStampedLoginToken();                                                      // 114
      var userId = self.userId;                                                                                  // 115
      Meteor.users.update(self.userId, {                                                                         // 116
        $set: {                                                                                                  // 117
          "services.resume.loginTokensToDelete": tokens,                                                         // 118
          "services.resume.haveLoginTokensToDelete": true                                                        // 119
        },                                                                                                       // 120
        $push: { "services.resume.loginTokens": newToken }                                                       // 121
      });                                                                                                        // 122
      Meteor.setTimeout(function () {                                                                            // 123
        // The observe on Meteor.users will take care of closing the connections                                 // 124
        // associated with `tokens`.                                                                             // 125
        deleteSavedTokens(userId, tokens);                                                                       // 126
      }, Accounts._noConnectionCloseDelayForTest ? 0 :                                                           // 127
                        CONNECTION_CLOSE_DELAY_MS);                                                              // 128
      // We do not set the login token on this connection, but instead the                                       // 129
      // observe closes the connection and the client will reconnect with the                                    // 130
      // new token.                                                                                              // 131
      return {                                                                                                   // 132
        token: newToken.token,                                                                                   // 133
        tokenExpires: Accounts._tokenExpiration(newToken.when)                                                   // 134
      };                                                                                                         // 135
    } else {                                                                                                     // 136
      throw new Error("You are not logged in.");                                                                 // 137
    }                                                                                                            // 138
  }                                                                                                              // 139
});                                                                                                              // 140
                                                                                                                 // 141
///                                                                                                              // 142
/// RECONNECT TOKENS                                                                                             // 143
///                                                                                                              // 144
/// support reconnecting using a meteor login token                                                              // 145
                                                                                                                 // 146
// Login handler for resume tokens.                                                                              // 147
Accounts.registerLoginHandler(function(options) {                                                                // 148
  if (!options.resume)                                                                                           // 149
    return undefined;                                                                                            // 150
                                                                                                                 // 151
  check(options.resume, String);                                                                                 // 152
  var user = Meteor.users.findOne({                                                                              // 153
    "services.resume.loginTokens.token": ""+options.resume                                                       // 154
  });                                                                                                            // 155
                                                                                                                 // 156
  if (!user) {                                                                                                   // 157
    throw new Meteor.Error(403, "You've been logged out by the server. " +                                       // 158
    "Please login again.");                                                                                      // 159
  }                                                                                                              // 160
                                                                                                                 // 161
  var token = _.find(user.services.resume.loginTokens, function (token) {                                        // 162
    return token.token === options.resume;                                                                       // 163
  });                                                                                                            // 164
                                                                                                                 // 165
  var tokenExpires = Accounts._tokenExpiration(token.when);                                                      // 166
  if (new Date() >= tokenExpires)                                                                                // 167
    throw new Meteor.Error(403, "Your session has expired. Please login again.");                                // 168
                                                                                                                 // 169
  return {                                                                                                       // 170
    token: options.resume,                                                                                       // 171
    tokenExpires: tokenExpires,                                                                                  // 172
    id: user._id                                                                                                 // 173
  };                                                                                                             // 174
});                                                                                                              // 175
                                                                                                                 // 176
// Semi-public. Used by other login methods to generate tokens.                                                  // 177
//                                                                                                               // 178
Accounts._generateStampedLoginToken = function () {                                                              // 179
  return {token: Random.id(), when: (new Date)};                                                                 // 180
};                                                                                                               // 181
                                                                                                                 // 182
// Deletes the given loginToken from the database. This will cause all                                           // 183
// connections associated with the token to be closed.                                                           // 184
var removeLoginToken = function (userId, loginToken) {                                                           // 185
  Meteor.users.update(userId, {                                                                                  // 186
    $pull: {                                                                                                     // 187
      "services.resume.loginTokens": { "token": loginToken }                                                     // 188
    }                                                                                                            // 189
  });                                                                                                            // 190
};                                                                                                               // 191
                                                                                                                 // 192
///                                                                                                              // 193
/// TOKEN EXPIRATION                                                                                             // 194
///                                                                                                              // 195
                                                                                                                 // 196
var expireTokenInterval;                                                                                         // 197
                                                                                                                 // 198
// Deletes expired tokens from the database and closes all open connections                                      // 199
// associated with these tokens.                                                                                 // 200
//                                                                                                               // 201
// Exported for tests. Also, the arguments are only used by                                                      // 202
// tests. oldestValidDate is simulate expiring tokens without waiting                                            // 203
// for them to actually expire. userId is used by tests to only expire                                           // 204
// tokens for the test user.                                                                                     // 205
var expireTokens = Accounts._expireTokens = function (oldestValidDate, userId) {                                 // 206
  var tokenLifetimeMs = getTokenLifetimeMs();                                                                    // 207
                                                                                                                 // 208
  // when calling from a test with extra arguments, you must specify both!                                       // 209
  if ((oldestValidDate && !userId) || (!oldestValidDate && userId)) {                                            // 210
    throw new Error("Bad test. Must specify both oldestValidDate and userId.");                                  // 211
  }                                                                                                              // 212
                                                                                                                 // 213
  oldestValidDate = oldestValidDate ||                                                                           // 214
    (new Date(new Date() - tokenLifetimeMs));                                                                    // 215
  var userFilter = userId ? {_id: userId} : {};                                                                  // 216
                                                                                                                 // 217
                                                                                                                 // 218
  // Backwards compatible with older versions of meteor that stored login token                                  // 219
  // timestamps as numbers.                                                                                      // 220
  Meteor.users.update(_.extend(userFilter, {                                                                     // 221
    $or: [                                                                                                       // 222
      { "services.resume.loginTokens.when": { $lt: oldestValidDate } },                                          // 223
      { "services.resume.loginTokens.when": { $lt: +oldestValidDate } }                                          // 224
    ]                                                                                                            // 225
  }), {                                                                                                          // 226
    $pull: {                                                                                                     // 227
      "services.resume.loginTokens": {                                                                           // 228
        $or: [                                                                                                   // 229
          { when: { $lt: oldestValidDate } },                                                                    // 230
          { when: { $lt: +oldestValidDate } }                                                                    // 231
        ]                                                                                                        // 232
      }                                                                                                          // 233
    }                                                                                                            // 234
  }, { multi: true });                                                                                           // 235
  // The observe on Meteor.users will take care of closing connections for                                       // 236
  // expired tokens.                                                                                             // 237
};                                                                                                               // 238
                                                                                                                 // 239
maybeStopExpireTokensInterval = function () {                                                                    // 240
  if (_.has(Accounts._options, "loginExpirationInDays") &&                                                       // 241
      Accounts._options.loginExpirationInDays === null &&                                                        // 242
      expireTokenInterval) {                                                                                     // 243
    Meteor.clearInterval(expireTokenInterval);                                                                   // 244
    expireTokenInterval = null;                                                                                  // 245
  }                                                                                                              // 246
};                                                                                                               // 247
                                                                                                                 // 248
expireTokenInterval = Meteor.setInterval(expireTokens,                                                           // 249
                                         EXPIRE_TOKENS_INTERVAL_MS);                                             // 250
                                                                                                                 // 251
///                                                                                                              // 252
/// CREATE USER HOOKS                                                                                            // 253
///                                                                                                              // 254
                                                                                                                 // 255
var onCreateUserHook = null;                                                                                     // 256
Accounts.onCreateUser = function (func) {                                                                        // 257
  if (onCreateUserHook)                                                                                          // 258
    throw new Error("Can only call onCreateUser once");                                                          // 259
  else                                                                                                           // 260
    onCreateUserHook = func;                                                                                     // 261
};                                                                                                               // 262
                                                                                                                 // 263
// XXX see comment on Accounts.createUser in passwords_server about adding a                                     // 264
// second "server options" argument.                                                                             // 265
var defaultCreateUserHook = function (options, user) {                                                           // 266
  if (options.profile)                                                                                           // 267
    user.profile = options.profile;                                                                              // 268
  return user;                                                                                                   // 269
};                                                                                                               // 270
                                                                                                                 // 271
// Called by accounts-password                                                                                   // 272
Accounts.insertUserDoc = function (options, user) {                                                              // 273
  // - clone user document, to protect from modification                                                         // 274
  // - add createdAt timestamp                                                                                   // 275
  // - prepare an _id, so that you can modify other collections (eg                                              // 276
  // create a first task for every new user)                                                                     // 277
  //                                                                                                             // 278
  // XXX If the onCreateUser or validateNewUser hooks fail, we might                                             // 279
  // end up having modified some other collection                                                                // 280
  // inappropriately. The solution is probably to have onCreateUser                                              // 281
  // accept two callbacks - one that gets called before inserting                                                // 282
  // the user document (in which you can modify its contents), and                                               // 283
  // one that gets called after (in which you should change other                                                // 284
  // collections)                                                                                                // 285
  user = _.extend({createdAt: new Date(), _id: Random.id()}, user);                                              // 286
                                                                                                                 // 287
  var result = {};                                                                                               // 288
  if (options.generateLoginToken) {                                                                              // 289
    var stampedToken = Accounts._generateStampedLoginToken();                                                    // 290
    result.token = stampedToken.token;                                                                           // 291
    result.tokenExpires = Accounts._tokenExpiration(stampedToken.when);                                          // 292
    Meteor._ensure(user, 'services', 'resume');                                                                  // 293
    if (_.has(user.services.resume, 'loginTokens'))                                                              // 294
      user.services.resume.loginTokens.push(stampedToken);                                                       // 295
    else                                                                                                         // 296
      user.services.resume.loginTokens = [stampedToken];                                                         // 297
  }                                                                                                              // 298
                                                                                                                 // 299
  var fullUser;                                                                                                  // 300
  if (onCreateUserHook) {                                                                                        // 301
    fullUser = onCreateUserHook(options, user);                                                                  // 302
                                                                                                                 // 303
    // This is *not* part of the API. We need this because we can't isolate                                      // 304
    // the global server environment between tests, meaning we can't test                                        // 305
    // both having a create user hook set and not having one set.                                                // 306
    if (fullUser === 'TEST DEFAULT HOOK')                                                                        // 307
      fullUser = defaultCreateUserHook(options, user);                                                           // 308
  } else {                                                                                                       // 309
    fullUser = defaultCreateUserHook(options, user);                                                             // 310
  }                                                                                                              // 311
                                                                                                                 // 312
  _.each(validateNewUserHooks, function (hook) {                                                                 // 313
    if (!hook(fullUser))                                                                                         // 314
      throw new Meteor.Error(403, "User validation failed");                                                     // 315
  });                                                                                                            // 316
                                                                                                                 // 317
  try {                                                                                                          // 318
    result.id = Meteor.users.insert(fullUser);                                                                   // 319
  } catch (e) {                                                                                                  // 320
    // XXX string parsing sucks, maybe                                                                           // 321
    // https://jira.mongodb.org/browse/SERVER-3069 will get fixed one day                                        // 322
    if (e.name !== 'MongoError') throw e;                                                                        // 323
    var match = e.err.match(/^E11000 duplicate key error index: ([^ ]+)/);                                       // 324
    if (!match) throw e;                                                                                         // 325
    if (match[1].indexOf('$emails.address') !== -1)                                                              // 326
      throw new Meteor.Error(403, "Email already exists.");                                                      // 327
    if (match[1].indexOf('username') !== -1)                                                                     // 328
      throw new Meteor.Error(403, "Username already exists.");                                                   // 329
    // XXX better error reporting for services.facebook.id duplicate, etc                                        // 330
    throw e;                                                                                                     // 331
  }                                                                                                              // 332
                                                                                                                 // 333
  return result;                                                                                                 // 334
};                                                                                                               // 335
                                                                                                                 // 336
var validateNewUserHooks = [];                                                                                   // 337
Accounts.validateNewUser = function (func) {                                                                     // 338
  validateNewUserHooks.push(func);                                                                               // 339
};                                                                                                               // 340
                                                                                                                 // 341
// XXX Find a better place for this utility function                                                             // 342
// Like Perl's quotemeta: quotes all regexp metacharacters. See                                                  // 343
//   https://github.com/substack/quotemeta/blob/master/index.js                                                  // 344
var quotemeta = function (str) {                                                                                 // 345
    return String(str).replace(/(\W)/g, '\\$1');                                                                 // 346
};                                                                                                               // 347
                                                                                                                 // 348
// Helper function: returns false if email does not match company domain from                                    // 349
// the configuration.                                                                                            // 350
var testEmailDomain = function (email) {                                                                         // 351
  var domain = Accounts._options.restrictCreationByEmailDomain;                                                  // 352
  return !domain ||                                                                                              // 353
    (_.isFunction(domain) && domain(email)) ||                                                                   // 354
    (_.isString(domain) &&                                                                                       // 355
      (new RegExp('@' + quotemeta(domain) + '$', 'i')).test(email));                                             // 356
};                                                                                                               // 357
                                                                                                                 // 358
// Validate new user's email or Google/Facebook/GitHub account's email                                           // 359
Accounts.validateNewUser(function (user) {                                                                       // 360
  var domain = Accounts._options.restrictCreationByEmailDomain;                                                  // 361
  if (!domain)                                                                                                   // 362
    return true;                                                                                                 // 363
                                                                                                                 // 364
  var emailIsGood = false;                                                                                       // 365
  if (!_.isEmpty(user.emails)) {                                                                                 // 366
    emailIsGood = _.any(user.emails, function (email) {                                                          // 367
      return testEmailDomain(email.address);                                                                     // 368
    });                                                                                                          // 369
  } else if (!_.isEmpty(user.services)) {                                                                        // 370
    // Find any email of any service and check it                                                                // 371
    emailIsGood = _.any(user.services, function (service) {                                                      // 372
      return service.email && testEmailDomain(service.email);                                                    // 373
    });                                                                                                          // 374
  }                                                                                                              // 375
                                                                                                                 // 376
  if (emailIsGood)                                                                                               // 377
    return true;                                                                                                 // 378
                                                                                                                 // 379
  if (_.isString(domain))                                                                                        // 380
    throw new Meteor.Error(403, "@" + domain + " email required");                                               // 381
  else                                                                                                           // 382
    throw new Meteor.Error(403, "Email doesn't match the criteria.");                                            // 383
});                                                                                                              // 384
                                                                                                                 // 385
///                                                                                                              // 386
/// MANAGING USER OBJECTS                                                                                        // 387
///                                                                                                              // 388
                                                                                                                 // 389
// Updates or creates a user after we authenticate with a 3rd party.                                             // 390
//                                                                                                               // 391
// @param serviceName {String} Service name (eg, twitter).                                                       // 392
// @param serviceData {Object} Data to store in the user's record                                                // 393
//        under services[serviceName]. Must include an "id" field                                                // 394
//        which is a unique identifier for the user in the service.                                              // 395
// @param options {Object, optional} Other options to pass to insertUserDoc                                      // 396
//        (eg, profile)                                                                                          // 397
// @returns {Object} Object with token and id keys, like the result                                              // 398
//        of the "login" method.                                                                                 // 399
//                                                                                                               // 400
Accounts.updateOrCreateUserFromExternalService = function(                                                       // 401
  serviceName, serviceData, options) {                                                                           // 402
  options = _.clone(options || {});                                                                              // 403
                                                                                                                 // 404
  if (serviceName === "password" || serviceName === "resume")                                                    // 405
    throw new Error(                                                                                             // 406
      "Can't use updateOrCreateUserFromExternalService with internal service "                                   // 407
        + serviceName);                                                                                          // 408
  if (!_.has(serviceData, 'id'))                                                                                 // 409
    throw new Error(                                                                                             // 410
      "Service data for service " + serviceName + " must include id");                                           // 411
                                                                                                                 // 412
  // Look for a user with the appropriate service user id.                                                       // 413
  var selector = {};                                                                                             // 414
  var serviceIdKey = "services." + serviceName + ".id";                                                          // 415
                                                                                                                 // 416
  // XXX Temporary special case for Twitter. (Issue #629)                                                        // 417
  //   The serviceData.id will be a string representation of an integer.                                         // 418
  //   We want it to match either a stored string or int representation.                                         // 419
  //   This is to cater to earlier versions of Meteor storing twitter                                            // 420
  //   user IDs in number form, and recent versions storing them as strings.                                     // 421
  //   This can be removed once migration technology is in place, and twitter                                    // 422
  //   users stored with integer IDs have been migrated to string IDs.                                           // 423
  if (serviceName === "twitter" && !isNaN(serviceData.id)) {                                                     // 424
    selector["$or"] = [{},{}];                                                                                   // 425
    selector["$or"][0][serviceIdKey] = serviceData.id;                                                           // 426
    selector["$or"][1][serviceIdKey] = parseInt(serviceData.id, 10);                                             // 427
  } else {                                                                                                       // 428
    selector[serviceIdKey] = serviceData.id;                                                                     // 429
  }                                                                                                              // 430
                                                                                                                 // 431
  var user = Meteor.users.findOne(selector);                                                                     // 432
                                                                                                                 // 433
  if (user) {                                                                                                    // 434
    // We *don't* process options (eg, profile) for update, but we do replace                                    // 435
    // the serviceData (eg, so that we keep an unexpired access token and                                        // 436
    // don't cache old email addresses in serviceData.email).                                                    // 437
    // XXX provide an onUpdateUser hook which would let apps update                                              // 438
    //     the profile too                                                                                       // 439
    var stampedToken = Accounts._generateStampedLoginToken();                                                    // 440
    var setAttrs = {};                                                                                           // 441
    _.each(serviceData, function(value, key) {                                                                   // 442
      setAttrs["services." + serviceName + "." + key] = value;                                                   // 443
    });                                                                                                          // 444
                                                                                                                 // 445
    // XXX Maybe we should re-use the selector above and notice if the update                                    // 446
    //     touches nothing?                                                                                      // 447
    Meteor.users.update(                                                                                         // 448
      user._id,                                                                                                  // 449
      {$set: setAttrs,                                                                                           // 450
       $push: {'services.resume.loginTokens': stampedToken}});                                                   // 451
    return {                                                                                                     // 452
      token: stampedToken.token,                                                                                 // 453
      id: user._id,                                                                                              // 454
      tokenExpires: Accounts._tokenExpiration(stampedToken.when)                                                 // 455
    };                                                                                                           // 456
  } else {                                                                                                       // 457
    // Create a new user with the service data. Pass other options through to                                    // 458
    // insertUserDoc.                                                                                            // 459
    user = {services: {}};                                                                                       // 460
    user.services[serviceName] = serviceData;                                                                    // 461
    options.generateLoginToken = true;                                                                           // 462
    return Accounts.insertUserDoc(options, user);                                                                // 463
  }                                                                                                              // 464
};                                                                                                               // 465
                                                                                                                 // 466
                                                                                                                 // 467
///                                                                                                              // 468
/// PUBLISHING DATA                                                                                              // 469
///                                                                                                              // 470
                                                                                                                 // 471
// Publish the current user's record to the client.                                                              // 472
Meteor.publish(null, function() {                                                                                // 473
  if (this.userId) {                                                                                             // 474
    return Meteor.users.find(                                                                                    // 475
      {_id: this.userId},                                                                                        // 476
      {fields: {profile: 1, username: 1, emails: 1}});                                                           // 477
  } else {                                                                                                       // 478
    return null;                                                                                                 // 479
  }                                                                                                              // 480
}, /*suppress autopublish warning*/{is_auto: true});                                                             // 481
                                                                                                                 // 482
// If autopublish is on, publish these user fields. Login service                                                // 483
// packages (eg accounts-google) add to these by calling                                                         // 484
// Accounts.addAutopublishFields Notably, this isn't implemented with                                            // 485
// multiple publishes since DDP only merges only across top-level                                                // 486
// fields, not subfields (such as 'services.facebook.accessToken')                                               // 487
var autopublishFields = {                                                                                        // 488
  loggedInUser: ['profile', 'username', 'emails'],                                                               // 489
  otherUsers: ['profile', 'username']                                                                            // 490
};                                                                                                               // 491
                                                                                                                 // 492
// Add to the list of fields or subfields to be automatically                                                    // 493
// published if autopublish is on. Must be called from top-level                                                 // 494
// code (ie, before Meteor.startup hooks run).                                                                   // 495
//                                                                                                               // 496
// @param opts {Object} with:                                                                                    // 497
//   - forLoggedInUser {Array} Array of fields published to the logged-in user                                   // 498
//   - forOtherUsers {Array} Array of fields published to users that aren't logged in                            // 499
Accounts.addAutopublishFields = function(opts) {                                                                 // 500
  autopublishFields.loggedInUser.push.apply(                                                                     // 501
    autopublishFields.loggedInUser, opts.forLoggedInUser);                                                       // 502
  autopublishFields.otherUsers.push.apply(                                                                       // 503
    autopublishFields.otherUsers, opts.forOtherUsers);                                                           // 504
};                                                                                                               // 505
                                                                                                                 // 506
if (Package.autopublish) {                                                                                       // 507
  // Use Meteor.startup to give other packages a chance to call                                                  // 508
  // addAutopublishFields.                                                                                       // 509
  Meteor.startup(function () {                                                                                   // 510
    // ['profile', 'username'] -> {profile: 1, username: 1}                                                      // 511
    var toFieldSelector = function(fields) {                                                                     // 512
      return _.object(_.map(fields, function(field) {                                                            // 513
        return [field, 1];                                                                                       // 514
      }));                                                                                                       // 515
    };                                                                                                           // 516
                                                                                                                 // 517
    Meteor.server.publish(null, function () {                                                                    // 518
      if (this.userId) {                                                                                         // 519
        return Meteor.users.find(                                                                                // 520
          {_id: this.userId},                                                                                    // 521
          {fields: toFieldSelector(autopublishFields.loggedInUser)});                                            // 522
      } else {                                                                                                   // 523
        return null;                                                                                             // 524
      }                                                                                                          // 525
    }, /*suppress autopublish warning*/{is_auto: true});                                                         // 526
                                                                                                                 // 527
    // XXX this publish is neither dedup-able nor is it optimized by our special                                 // 528
    // treatment of queries on a specific _id. Therefore this will have O(n^2)                                   // 529
    // run-time performance every time a user document is changed (eg someone                                    // 530
    // logging in). If this is a problem, we can instead write a manual publish                                  // 531
    // function which filters out fields based on 'this.userId'.                                                 // 532
    Meteor.server.publish(null, function () {                                                                    // 533
      var selector;                                                                                              // 534
      if (this.userId)                                                                                           // 535
        selector = {_id: {$ne: this.userId}};                                                                    // 536
      else                                                                                                       // 537
        selector = {};                                                                                           // 538
                                                                                                                 // 539
      return Meteor.users.find(                                                                                  // 540
        selector,                                                                                                // 541
        {fields: toFieldSelector(autopublishFields.otherUsers)});                                                // 542
    }, /*suppress autopublish warning*/{is_auto: true});                                                         // 543
  });                                                                                                            // 544
}                                                                                                                // 545
                                                                                                                 // 546
// Publish all login service configuration fields other than secret.                                             // 547
Meteor.publish("meteor.loginServiceConfiguration", function () {                                                 // 548
  return ServiceConfiguration.configurations.find({}, {fields: {secret: 0}});                                    // 549
}, {is_auto: true}); // not techincally autopublish, but stops the warning.                                      // 550
                                                                                                                 // 551
// Allow a one-time configuration for a login service. Modifications                                             // 552
// to this collection are also allowed in insecure mode.                                                         // 553
Meteor.methods({                                                                                                 // 554
  "configureLoginService": function (options) {                                                                  // 555
    check(options, Match.ObjectIncluding({service: String}));                                                    // 556
    // Don't let random users configure a service we haven't added yet (so                                       // 557
    // that when we do later add it, it's set up with their configuration                                        // 558
    // instead of ours).                                                                                         // 559
    // XXX if service configuration is oauth-specific then this code should                                      // 560
    //     be in accounts-oauth; if it's not then the registry should be                                         // 561
    //     in this package                                                                                       // 562
    if (!(Accounts.oauth                                                                                         // 563
          && _.contains(Accounts.oauth.serviceNames(), options.service))) {                                      // 564
      throw new Meteor.Error(403, "Service unknown");                                                            // 565
    }                                                                                                            // 566
    if (ServiceConfiguration.configurations.findOne({service: options.service}))                                 // 567
      throw new Meteor.Error(403, "Service " + options.service + " already configured");                         // 568
    ServiceConfiguration.configurations.insert(options);                                                         // 569
  }                                                                                                              // 570
});                                                                                                              // 571
                                                                                                                 // 572
                                                                                                                 // 573
///                                                                                                              // 574
/// RESTRICTING WRITES TO USER OBJECTS                                                                           // 575
///                                                                                                              // 576
                                                                                                                 // 577
Meteor.users.allow({                                                                                             // 578
  // clients can modify the profile field of their own document, and                                             // 579
  // nothing else.                                                                                               // 580
  update: function (userId, user, fields, modifier) {                                                            // 581
    // make sure it is our record                                                                                // 582
    if (user._id !== userId)                                                                                     // 583
      return false;                                                                                              // 584
                                                                                                                 // 585
    // user can only modify the 'profile' field. sets to multiple                                                // 586
    // sub-keys (eg profile.foo and profile.bar) are merged into entry                                           // 587
    // in the fields list.                                                                                       // 588
    if (fields.length !== 1 || fields[0] !== 'profile')                                                          // 589
      return false;                                                                                              // 590
                                                                                                                 // 591
    return true;                                                                                                 // 592
  },                                                                                                             // 593
  fetch: ['_id'] // we only look at _id.                                                                         // 594
});                                                                                                              // 595
                                                                                                                 // 596
/// DEFAULT INDEXES ON USERS                                                                                     // 597
Meteor.users._ensureIndex('username', {unique: 1, sparse: 1});                                                   // 598
Meteor.users._ensureIndex('emails.address', {unique: 1, sparse: 1});                                             // 599
Meteor.users._ensureIndex('services.resume.loginTokens.token',                                                   // 600
                          {unique: 1, sparse: 1});                                                               // 601
// For taking care of logoutOtherClients calls that crashed before the tokens                                    // 602
// were deleted.                                                                                                 // 603
Meteor.users._ensureIndex('services.resume.haveLoginTokensToDelete',                                             // 604
                          { sparse: 1 });                                                                        // 605
// For expiring login tokens                                                                                     // 606
Meteor.users._ensureIndex("services.resume.loginTokens.when", { sparse: 1 });                                    // 607
                                                                                                                 // 608
///                                                                                                              // 609
/// CLEAN UP FOR `logoutOtherClients`                                                                            // 610
///                                                                                                              // 611
                                                                                                                 // 612
var deleteSavedTokens = function (userId, tokensToDelete) {                                                      // 613
  if (tokensToDelete) {                                                                                          // 614
    Meteor.users.update(userId, {                                                                                // 615
      $unset: {                                                                                                  // 616
        "services.resume.haveLoginTokensToDelete": 1,                                                            // 617
        "services.resume.loginTokensToDelete": 1                                                                 // 618
      },                                                                                                         // 619
      $pullAll: {                                                                                                // 620
        "services.resume.loginTokens": tokensToDelete                                                            // 621
      }                                                                                                          // 622
    });                                                                                                          // 623
  }                                                                                                              // 624
};                                                                                                               // 625
                                                                                                                 // 626
Meteor.startup(function () {                                                                                     // 627
  // If we find users who have saved tokens to delete on startup, delete them                                    // 628
  // now. It's possible that the server could have crashed and come back up                                      // 629
  // before new tokens are found in localStorage, but this shouldn't happen very                                 // 630
  // often. We shouldn't put a delay here because that would give a lot of power                                 // 631
  // to an attacker with a stolen login token and the ability to crash the                                       // 632
  // server.                                                                                                     // 633
  var users = Meteor.users.find({                                                                                // 634
    "services.resume.haveLoginTokensToDelete": true                                                              // 635
  }, {                                                                                                           // 636
    "services.resume.loginTokensToDelete": 1                                                                     // 637
  });                                                                                                            // 638
  users.forEach(function (user) {                                                                                // 639
    deleteSavedTokens(user._id, user.services.resume.loginTokensToDelete);                                       // 640
  });                                                                                                            // 641
});                                                                                                              // 642
                                                                                                                 // 643
///                                                                                                              // 644
/// LOGGING OUT DELETED USERS                                                                                    // 645
///                                                                                                              // 646
                                                                                                                 // 647
var closeTokensForUser = function (userTokens) {                                                                 // 648
  Meteor.server._closeAllForTokens(_.map(userTokens, function (token) {                                          // 649
    return token.token;                                                                                          // 650
  }));                                                                                                           // 651
};                                                                                                               // 652
                                                                                                                 // 653
Meteor.users.find({}, { fields: { "services.resume": 1 }}).observe({                                             // 654
  changed: function (newUser, oldUser) {                                                                         // 655
    var removedTokens = [];                                                                                      // 656
    if (newUser.services && newUser.services.resume &&                                                           // 657
        oldUser.services && oldUser.services.resume) {                                                           // 658
      removedTokens = _.difference(oldUser.services.resume.loginTokens || [],                                    // 659
                                   newUser.services.resume.loginTokens || []);                                   // 660
    } else if (oldUser.services && oldUser.services.resume) {                                                    // 661
      removedTokens = oldUser.services.resume.loginTokens || [];                                                 // 662
    }                                                                                                            // 663
    closeTokensForUser(removedTokens);                                                                           // 664
  },                                                                                                             // 665
  removed: function (oldUser) {                                                                                  // 666
    if (oldUser.services && oldUser.services.resume)                                                             // 667
      closeTokensForUser(oldUser.services.resume.loginTokens || []);                                             // 668
  }                                                                                                              // 669
});                                                                                                              // 670
                                                                                                                 // 671
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/accounts-base/url_server.js                                                                          //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
// XXX These should probably not actually be public?                                                             // 1
                                                                                                                 // 2
Accounts.urls = {};                                                                                              // 3
                                                                                                                 // 4
Accounts.urls.resetPassword = function (token) {                                                                 // 5
  return Meteor.absoluteUrl('#/reset-password/' + token);                                                        // 6
};                                                                                                               // 7
                                                                                                                 // 8
Accounts.urls.verifyEmail = function (token) {                                                                   // 9
  return Meteor.absoluteUrl('#/verify-email/' + token);                                                          // 10
};                                                                                                               // 11
                                                                                                                 // 12
Accounts.urls.enrollAccount = function (token) {                                                                 // 13
  return Meteor.absoluteUrl('#/enroll-account/' + token);                                                        // 14
};                                                                                                               // 15
                                                                                                                 // 16
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['accounts-base'] = {
  Accounts: Accounts
};

})();
