(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var Accounts = Package['accounts-base'].Accounts;
var SRP = Package.srp.SRP;
var Email = Package.email.Email;
var Random = Package.random.Random;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var DDP = Package.livedata.DDP;
var DDPServer = Package.livedata.DDPServer;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                         //
// packages/accounts-password/email_templates.js                                           //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
                                                                                           //
Accounts.emailTemplates = {                                                                // 1
  from: "Meteor Accounts <no-reply@meteor.com>",                                           // 2
  siteName: Meteor.absoluteUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''),           // 3
                                                                                           // 4
  resetPassword: {                                                                         // 5
    subject: function(user) {                                                              // 6
      return "How to reset your password on " + Accounts.emailTemplates.siteName;          // 7
    },                                                                                     // 8
    text: function(user, url) {                                                            // 9
      var greeting = (user.profile && user.profile.name) ?                                 // 10
            ("Hello " + user.profile.name + ",") : "Hello,";                               // 11
      return greeting + "\n"                                                               // 12
        + "\n"                                                                             // 13
        + "To reset your password, simply click the link below.\n"                         // 14
        + "\n"                                                                             // 15
        + url + "\n"                                                                       // 16
        + "\n"                                                                             // 17
        + "Thanks.\n";                                                                     // 18
    }                                                                                      // 19
  },                                                                                       // 20
  verifyEmail: {                                                                           // 21
    subject: function(user) {                                                              // 22
      return "How to verify email address on " + Accounts.emailTemplates.siteName;         // 23
    },                                                                                     // 24
    text: function(user, url) {                                                            // 25
      var greeting = (user.profile && user.profile.name) ?                                 // 26
            ("Hello " + user.profile.name + ",") : "Hello,";                               // 27
      return greeting + "\n"                                                               // 28
        + "\n"                                                                             // 29
        + "To verify your account email, simply click the link below.\n"                   // 30
        + "\n"                                                                             // 31
        + url + "\n"                                                                       // 32
        + "\n"                                                                             // 33
        + "Thanks.\n";                                                                     // 34
    }                                                                                      // 35
  },                                                                                       // 36
  enrollAccount: {                                                                         // 37
    subject: function(user) {                                                              // 38
      return "An account has been created for you on " + Accounts.emailTemplates.siteName; // 39
    },                                                                                     // 40
    text: function(user, url) {                                                            // 41
      var greeting = (user.profile && user.profile.name) ?                                 // 42
            ("Hello " + user.profile.name + ",") : "Hello,";                               // 43
      return greeting + "\n"                                                               // 44
        + "\n"                                                                             // 45
        + "To start using the service, simply click the link below.\n"                     // 46
        + "\n"                                                                             // 47
        + url + "\n"                                                                       // 48
        + "\n"                                                                             // 49
        + "Thanks.\n";                                                                     // 50
    }                                                                                      // 51
  }                                                                                        // 52
};                                                                                         // 53
                                                                                           // 54
/////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                         //
// packages/accounts-password/password_server.js                                           //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
                                                                                           //
///                                                                                        // 1
/// LOGIN                                                                                  // 2
///                                                                                        // 3
                                                                                           // 4
// Users can specify various keys to identify themselves with.                             // 5
// @param user {Object} with one of `id`, `username`, or `email`.                          // 6
// @returns A selector to pass to mongo to get the user record.                            // 7
                                                                                           // 8
var selectorFromUserQuery = function (user) {                                              // 9
  if (user.id)                                                                             // 10
    return {_id: user.id};                                                                 // 11
  else if (user.username)                                                                  // 12
    return {username: user.username};                                                      // 13
  else if (user.email)                                                                     // 14
    return {"emails.address": user.email};                                                 // 15
  throw new Error("shouldn't happen (validation missed something)");                       // 16
};                                                                                         // 17
                                                                                           // 18
// XXX maybe this belongs in the check package                                             // 19
var NonEmptyString = Match.Where(function (x) {                                            // 20
  check(x, String);                                                                        // 21
  return x.length > 0;                                                                     // 22
});                                                                                        // 23
                                                                                           // 24
var userQueryValidator = Match.Where(function (user) {                                     // 25
  check(user, {                                                                            // 26
    id: Match.Optional(NonEmptyString),                                                    // 27
    username: Match.Optional(NonEmptyString),                                              // 28
    email: Match.Optional(NonEmptyString)                                                  // 29
  });                                                                                      // 30
  if (_.keys(user).length !== 1)                                                           // 31
    throw new Match.Error("User property must have exactly one field");                    // 32
  return true;                                                                             // 33
});                                                                                        // 34
                                                                                           // 35
// Step 1 of SRP password exchange. This puts an `M` value in the                          // 36
// session data for this connection. If a client later sends the same                      // 37
// `M` value to a method on this connection, it proves they know the                       // 38
// password for this user. We can then prove we know the password to                       // 39
// them by sending our `HAMK` value.                                                       // 40
//                                                                                         // 41
// @param request {Object} with fields:                                                    // 42
//   user: either {username: (username)}, {email: (email)}, or {id: (userId)}              // 43
//   A: hex encoded int. the client's public key for this exchange                         // 44
// @returns {Object} with fields:                                                          // 45
//   identity: random string ID                                                            // 46
//   salt: random string ID                                                                // 47
//   B: hex encoded int. server's public key for this exchange                             // 48
Meteor.methods({beginPasswordExchange: function (request) {                                // 49
  check(request, {                                                                         // 50
    user: userQueryValidator,                                                              // 51
    A: String                                                                              // 52
  });                                                                                      // 53
  var selector = selectorFromUserQuery(request.user);                                      // 54
                                                                                           // 55
  var user = Meteor.users.findOne(selector);                                               // 56
  if (!user)                                                                               // 57
    throw new Meteor.Error(403, "User not found");                                         // 58
                                                                                           // 59
  if (!user.services || !user.services.password ||                                         // 60
      !user.services.password.srp)                                                         // 61
    throw new Meteor.Error(403, "User has no password set");                               // 62
                                                                                           // 63
  var verifier = user.services.password.srp;                                               // 64
  var srp = new SRP.Server(verifier);                                                      // 65
  var challenge = srp.issueChallenge({A: request.A});                                      // 66
                                                                                           // 67
  // save off results in the current session so we can verify them                         // 68
  // later.                                                                                // 69
  this._sessionData.srpChallenge =                                                         // 70
    { userId: user._id, M: srp.M, HAMK: srp.HAMK };                                        // 71
                                                                                           // 72
  return challenge;                                                                        // 73
}});                                                                                       // 74
                                                                                           // 75
// Handler to login with password via SRP. Checks the `M` value set by                     // 76
// beginPasswordExchange.                                                                  // 77
Accounts.registerLoginHandler(function (options) {                                         // 78
  if (!options.srp)                                                                        // 79
    return undefined; // don't handle                                                      // 80
  check(options.srp, {M: String});                                                         // 81
                                                                                           // 82
  // we're always called from within a 'login' method, so this should                      // 83
  // be safe.                                                                              // 84
  var currentInvocation = DDP._CurrentInvocation.get();                                    // 85
  var serialized = currentInvocation._sessionData.srpChallenge;                            // 86
  if (!serialized || serialized.M !== options.srp.M)                                       // 87
    throw new Meteor.Error(403, "Incorrect password");                                     // 88
  // Only can use challenges once.                                                         // 89
  delete currentInvocation._sessionData.srpChallenge;                                      // 90
                                                                                           // 91
  var userId = serialized.userId;                                                          // 92
  var user = Meteor.users.findOne(userId);                                                 // 93
  // Was the user deleted since the start of this challenge?                               // 94
  if (!user)                                                                               // 95
    throw new Meteor.Error(403, "User not found");                                         // 96
  var stampedLoginToken = Accounts._generateStampedLoginToken();                           // 97
  Meteor.users.update(                                                                     // 98
    userId, {$push: {'services.resume.loginTokens': stampedLoginToken}});                  // 99
                                                                                           // 100
  return {                                                                                 // 101
    token: stampedLoginToken.token,                                                        // 102
    tokenExpires: Accounts._tokenExpiration(stampedLoginToken.when),                       // 103
    id: userId,                                                                            // 104
    HAMK: serialized.HAMK                                                                  // 105
  };                                                                                       // 106
});                                                                                        // 107
                                                                                           // 108
// Handler to login with plaintext password.                                               // 109
//                                                                                         // 110
// The meteor client doesn't use this, it is for other DDP clients who                     // 111
// haven't implemented SRP. Since it sends the password in plaintext                       // 112
// over the wire, it should only be run over SSL!                                          // 113
//                                                                                         // 114
// Also, it might be nice if servers could turn this off. Or maybe it                      // 115
// should be opt-in, not opt-out? Accounts.config option?                                  // 116
Accounts.registerLoginHandler(function (options) {                                         // 117
  if (!options.password || !options.user)                                                  // 118
    return undefined; // don't handle                                                      // 119
                                                                                           // 120
  check(options, {user: userQueryValidator, password: String});                            // 121
                                                                                           // 122
  var selector = selectorFromUserQuery(options.user);                                      // 123
  var user = Meteor.users.findOne(selector);                                               // 124
  if (!user)                                                                               // 125
    throw new Meteor.Error(403, "User not found");                                         // 126
                                                                                           // 127
  if (!user.services || !user.services.password ||                                         // 128
      !user.services.password.srp)                                                         // 129
    throw new Meteor.Error(403, "User has no password set");                               // 130
                                                                                           // 131
  // Just check the verifier output when the same identity and salt                        // 132
  // are passed. Don't bother with a full exchange.                                        // 133
  var verifier = user.services.password.srp;                                               // 134
  var newVerifier = SRP.generateVerifier(options.password, {                               // 135
    identity: verifier.identity, salt: verifier.salt});                                    // 136
                                                                                           // 137
  if (verifier.verifier !== newVerifier.verifier)                                          // 138
    throw new Meteor.Error(403, "Incorrect password");                                     // 139
                                                                                           // 140
  var stampedLoginToken = Accounts._generateStampedLoginToken();                           // 141
  Meteor.users.update(                                                                     // 142
    user._id, {$push: {'services.resume.loginTokens': stampedLoginToken}});                // 143
                                                                                           // 144
  return {                                                                                 // 145
    token: stampedLoginToken.token,                                                        // 146
    tokenExpires: Accounts._tokenExpiration(stampedLoginToken.when),                       // 147
    id: user._id                                                                           // 148
  };                                                                                       // 149
});                                                                                        // 150
                                                                                           // 151
                                                                                           // 152
///                                                                                        // 153
/// CHANGING                                                                               // 154
///                                                                                        // 155
                                                                                           // 156
// Let the user change their own password if they know the old                             // 157
// password. Checks the `M` value set by beginPasswordExchange.                            // 158
Meteor.methods({changePassword: function (options) {                                       // 159
  if (!this.userId)                                                                        // 160
    throw new Meteor.Error(401, "Must be logged in");                                      // 161
  check(options, {                                                                         // 162
    // If options.M is set, it means we went through a challenge with the old              // 163
    // password. For now, we don't allow changePassword without knowing the old            // 164
    // password.                                                                           // 165
    M: String,                                                                             // 166
    srp: Match.Optional(SRP.matchVerifier),                                                // 167
    password: Match.Optional(String)                                                       // 168
  });                                                                                      // 169
                                                                                           // 170
  var serialized = this._sessionData.srpChallenge;                                         // 171
  if (!serialized || serialized.M !== options.M)                                           // 172
    throw new Meteor.Error(403, "Incorrect password");                                     // 173
  if (serialized.userId !== this.userId)                                                   // 174
    // No monkey business!                                                                 // 175
    throw new Meteor.Error(403, "Incorrect password");                                     // 176
  // Only can use challenges once.                                                         // 177
  delete this._sessionData.srpChallenge;                                                   // 178
                                                                                           // 179
  var verifier = options.srp;                                                              // 180
  if (!verifier && options.password) {                                                     // 181
    verifier = SRP.generateVerifier(options.password);                                     // 182
  }                                                                                        // 183
  if (!verifier)                                                                           // 184
    throw new Meteor.Error(400, "Invalid verifier");                                       // 185
                                                                                           // 186
  // XXX this should invalidate all login tokens other than the current one                // 187
  // (or it should assign a new login token, replacing existing ones)                      // 188
  Meteor.users.update({_id: this.userId},                                                  // 189
                      {$set: {'services.password.srp': verifier}});                        // 190
                                                                                           // 191
  var ret = {passwordChanged: true};                                                       // 192
  if (serialized)                                                                          // 193
    ret.HAMK = serialized.HAMK;                                                            // 194
  return ret;                                                                              // 195
}});                                                                                       // 196
                                                                                           // 197
                                                                                           // 198
// Force change the users password.                                                        // 199
Accounts.setPassword = function (userId, newPassword) {                                    // 200
  var user = Meteor.users.findOne(userId);                                                 // 201
  if (!user)                                                                               // 202
    throw new Meteor.Error(403, "User not found");                                         // 203
  var newVerifier = SRP.generateVerifier(newPassword);                                     // 204
                                                                                           // 205
  Meteor.users.update({_id: user._id}, {                                                   // 206
    $set: {'services.password.srp': newVerifier}});                                        // 207
};                                                                                         // 208
                                                                                           // 209
                                                                                           // 210
///                                                                                        // 211
/// RESETTING VIA EMAIL                                                                    // 212
///                                                                                        // 213
                                                                                           // 214
// Method called by a user to request a password reset email. This is                      // 215
// the start of the reset process.                                                         // 216
Meteor.methods({forgotPassword: function (options) {                                       // 217
  check(options, {email: String});                                                         // 218
                                                                                           // 219
  var user = Meteor.users.findOne({"emails.address": options.email});                      // 220
  if (!user)                                                                               // 221
    throw new Meteor.Error(403, "User not found");                                         // 222
                                                                                           // 223
  Accounts.sendResetPasswordEmail(user._id, options.email);                                // 224
}});                                                                                       // 225
                                                                                           // 226
// send the user an email with a link that when opened allows the user                     // 227
// to set a new password, without the old password.                                        // 228
//                                                                                         // 229
Accounts.sendResetPasswordEmail = function (userId, email) {                               // 230
  // Make sure the user exists, and email is one of their addresses.                       // 231
  var user = Meteor.users.findOne(userId);                                                 // 232
  if (!user)                                                                               // 233
    throw new Error("Can't find user");                                                    // 234
  // pick the first email if we weren't passed an email.                                   // 235
  if (!email && user.emails && user.emails[0])                                             // 236
    email = user.emails[0].address;                                                        // 237
  // make sure we have a valid email                                                       // 238
  if (!email || !_.contains(_.pluck(user.emails || [], 'address'), email))                 // 239
    throw new Error("No such email for user.");                                            // 240
                                                                                           // 241
  var token = Random.id();                                                                 // 242
  var when = new Date();                                                                   // 243
  Meteor.users.update(userId, {$set: {                                                     // 244
    "services.password.reset": {                                                           // 245
      token: token,                                                                        // 246
      email: email,                                                                        // 247
      when: when                                                                           // 248
    }                                                                                      // 249
  }});                                                                                     // 250
                                                                                           // 251
  var resetPasswordUrl = Accounts.urls.resetPassword(token);                               // 252
  Email.send({                                                                             // 253
    to: email,                                                                             // 254
    from: Accounts.emailTemplates.from,                                                    // 255
    subject: Accounts.emailTemplates.resetPassword.subject(user),                          // 256
    text: Accounts.emailTemplates.resetPassword.text(user, resetPasswordUrl)});            // 257
};                                                                                         // 258
                                                                                           // 259
// send the user an email informing them that their account was created, with              // 260
// a link that when opened both marks their email as verified and forces them              // 261
// to choose their password. The email must be one of the addresses in the                 // 262
// user's emails field, or undefined to pick the first email automatically.                // 263
//                                                                                         // 264
// This is not called automatically. It must be called manually if you                     // 265
// want to use enrollment emails.                                                          // 266
//                                                                                         // 267
Accounts.sendEnrollmentEmail = function (userId, email) {                                  // 268
  // XXX refactor! This is basically identical to sendResetPasswordEmail.                  // 269
                                                                                           // 270
  // Make sure the user exists, and email is in their addresses.                           // 271
  var user = Meteor.users.findOne(userId);                                                 // 272
  if (!user)                                                                               // 273
    throw new Error("Can't find user");                                                    // 274
  // pick the first email if we weren't passed an email.                                   // 275
  if (!email && user.emails && user.emails[0])                                             // 276
    email = user.emails[0].address;                                                        // 277
  // make sure we have a valid email                                                       // 278
  if (!email || !_.contains(_.pluck(user.emails || [], 'address'), email))                 // 279
    throw new Error("No such email for user.");                                            // 280
                                                                                           // 281
                                                                                           // 282
  var token = Random.id();                                                                 // 283
  var when = new Date();                                                                   // 284
  Meteor.users.update(userId, {$set: {                                                     // 285
    "services.password.reset": {                                                           // 286
      token: token,                                                                        // 287
      email: email,                                                                        // 288
      when: when                                                                           // 289
    }                                                                                      // 290
  }});                                                                                     // 291
                                                                                           // 292
  var enrollAccountUrl = Accounts.urls.enrollAccount(token);                               // 293
  Email.send({                                                                             // 294
    to: email,                                                                             // 295
    from: Accounts.emailTemplates.from,                                                    // 296
    subject: Accounts.emailTemplates.enrollAccount.subject(user),                          // 297
    text: Accounts.emailTemplates.enrollAccount.text(user, enrollAccountUrl)               // 298
  });                                                                                      // 299
};                                                                                         // 300
                                                                                           // 301
                                                                                           // 302
// Take token from sendResetPasswordEmail or sendEnrollmentEmail, change                   // 303
// the users password, and log them in.                                                    // 304
Meteor.methods({resetPassword: function (token, newVerifier) {                             // 305
  check(token, String);                                                                    // 306
  check(newVerifier, SRP.matchVerifier);                                                   // 307
                                                                                           // 308
  var user = Meteor.users.findOne({                                                        // 309
    "services.password.reset.token": ""+token});                                           // 310
  if (!user)                                                                               // 311
    throw new Meteor.Error(403, "Token expired");                                          // 312
  var email = user.services.password.reset.email;                                          // 313
  if (!_.include(_.pluck(user.emails || [], 'address'), email))                            // 314
    throw new Meteor.Error(403, "Token has invalid email address");                        // 315
                                                                                           // 316
  var stampedLoginToken = Accounts._generateStampedLoginToken();                           // 317
                                                                                           // 318
  // NOTE: We're about to invalidate tokens on the user, who we might be                   // 319
  // logged in as. Make sure to avoid logging ourselves out if this                        // 320
  // happens. But also make sure not to leave the connection in a state                    // 321
  // of having a bad token set if things fail.                                             // 322
  var oldToken = this._getLoginToken();                                                    // 323
  this._setLoginToken(null);                                                               // 324
                                                                                           // 325
  try {                                                                                    // 326
    // Update the user record by:                                                          // 327
    // - Changing the password verifier to the new one                                     // 328
    // - Replacing all valid login tokens with new ones (changing                          // 329
    //   password should invalidate existing sessions).                                    // 330
    // - Forgetting about the reset token that was just used                               // 331
    // - Verifying their email, since they got the password reset via email.               // 332
    Meteor.users.update({_id: user._id, 'emails.address': email}, {                        // 333
      $set: {'services.password.srp': newVerifier,                                         // 334
             'services.resume.loginTokens': [stampedLoginToken],                           // 335
             'emails.$.verified': true},                                                   // 336
      $unset: {'services.password.reset': 1}                                               // 337
    });                                                                                    // 338
  } catch (err) {                                                                          // 339
    // update failed somehow. reset to old token.                                          // 340
    this._setLoginToken(oldToken);                                                         // 341
    throw err;                                                                             // 342
  }                                                                                        // 343
                                                                                           // 344
  this._setLoginToken(stampedLoginToken.token);                                            // 345
  this.setUserId(user._id);                                                                // 346
                                                                                           // 347
  return {                                                                                 // 348
    token: stampedLoginToken.token,                                                        // 349
    tokenExpires: Accounts._tokenExpiration(stampedLoginToken.when),                       // 350
    id: user._id                                                                           // 351
  };                                                                                       // 352
}});                                                                                       // 353
                                                                                           // 354
///                                                                                        // 355
/// EMAIL VERIFICATION                                                                     // 356
///                                                                                        // 357
                                                                                           // 358
                                                                                           // 359
// send the user an email with a link that when opened marks that                          // 360
// address as verified                                                                     // 361
//                                                                                         // 362
Accounts.sendVerificationEmail = function (userId, address) {                              // 363
  // XXX Also generate a link using which someone can delete this                          // 364
  // account if they own said address but weren't those who created                        // 365
  // this account.                                                                         // 366
                                                                                           // 367
  // Make sure the user exists, and address is one of their addresses.                     // 368
  var user = Meteor.users.findOne(userId);                                                 // 369
  if (!user)                                                                               // 370
    throw new Error("Can't find user");                                                    // 371
  // pick the first unverified address if we weren't passed an address.                    // 372
  if (!address) {                                                                          // 373
    var email = _.find(user.emails || [],                                                  // 374
                       function (e) { return !e.verified; });                              // 375
    address = (email || {}).address;                                                       // 376
  }                                                                                        // 377
  // make sure we have a valid address                                                     // 378
  if (!address || !_.contains(_.pluck(user.emails || [], 'address'), address))             // 379
    throw new Error("No such email address for user.");                                    // 380
                                                                                           // 381
                                                                                           // 382
  var tokenRecord = {                                                                      // 383
    token: Random.id(),                                                                    // 384
    address: address,                                                                      // 385
    when: new Date()};                                                                     // 386
  Meteor.users.update(                                                                     // 387
    {_id: userId},                                                                         // 388
    {$push: {'services.email.verificationTokens': tokenRecord}});                          // 389
                                                                                           // 390
  var verifyEmailUrl = Accounts.urls.verifyEmail(tokenRecord.token);                       // 391
  Email.send({                                                                             // 392
    to: address,                                                                           // 393
    from: Accounts.emailTemplates.from,                                                    // 394
    subject: Accounts.emailTemplates.verifyEmail.subject(user),                            // 395
    text: Accounts.emailTemplates.verifyEmail.text(user, verifyEmailUrl)                   // 396
  });                                                                                      // 397
};                                                                                         // 398
                                                                                           // 399
// Take token from sendVerificationEmail, mark the email as verified,                      // 400
// and log them in.                                                                        // 401
Meteor.methods({verifyEmail: function (token) {                                            // 402
  check(token, String);                                                                    // 403
                                                                                           // 404
  var user = Meteor.users.findOne(                                                         // 405
    {'services.email.verificationTokens.token': token});                                   // 406
  if (!user)                                                                               // 407
    throw new Meteor.Error(403, "Verify email link expired");                              // 408
                                                                                           // 409
  var tokenRecord = _.find(user.services.email.verificationTokens,                         // 410
                           function (t) {                                                  // 411
                             return t.token == token;                                      // 412
                           });                                                             // 413
  if (!tokenRecord)                                                                        // 414
    throw new Meteor.Error(403, "Verify email link expired");                              // 415
                                                                                           // 416
  var emailsRecord = _.find(user.emails, function (e) {                                    // 417
    return e.address == tokenRecord.address;                                               // 418
  });                                                                                      // 419
  if (!emailsRecord)                                                                       // 420
    throw new Meteor.Error(403, "Verify email link is for unknown address");               // 421
                                                                                           // 422
  // Log the user in with a new login token.                                               // 423
  var stampedLoginToken = Accounts._generateStampedLoginToken();                           // 424
                                                                                           // 425
  // By including the address in the query, we can use 'emails.$' in the                   // 426
  // modifier to get a reference to the specific object in the emails                      // 427
  // array. See                                                                            // 428
  // http://www.mongodb.org/display/DOCS/Updating/#Updating-The%24positionaloperator)      // 429
  // http://www.mongodb.org/display/DOCS/Updating#Updating-%24pull                         // 430
  Meteor.users.update(                                                                     // 431
    {_id: user._id,                                                                        // 432
     'emails.address': tokenRecord.address},                                               // 433
    {$set: {'emails.$.verified': true},                                                    // 434
     $pull: {'services.email.verificationTokens': {token: token}},                         // 435
     $push: {'services.resume.loginTokens': stampedLoginToken}});                          // 436
                                                                                           // 437
  this.setUserId(user._id);                                                                // 438
  this._setLoginToken(stampedLoginToken.token);                                            // 439
  return {                                                                                 // 440
    token: stampedLoginToken.token,                                                        // 441
    tokenExpires: Accounts._tokenExpiration(stampedLoginToken.when),                       // 442
    id: user._id                                                                           // 443
  };                                                                                       // 444
}});                                                                                       // 445
                                                                                           // 446
                                                                                           // 447
                                                                                           // 448
///                                                                                        // 449
/// CREATING USERS                                                                         // 450
///                                                                                        // 451
                                                                                           // 452
// Shared createUser function called from the createUser method, both                      // 453
// if originates in client or server code. Calls user provided hooks,                      // 454
// does the actual user insertion.                                                         // 455
//                                                                                         // 456
// returns an object with id: userId, and (if options.generateLoginToken is                // 457
// set) token: loginToken.                                                                 // 458
var createUser = function (options) {                                                      // 459
  // Unknown keys allowed, because a onCreateUserHook can take arbitrary                   // 460
  // options.                                                                              // 461
  check(options, Match.ObjectIncluding({                                                   // 462
    generateLoginToken: Boolean,                                                           // 463
    username: Match.Optional(String),                                                      // 464
    email: Match.Optional(String),                                                         // 465
    password: Match.Optional(String),                                                      // 466
    srp: Match.Optional(SRP.matchVerifier)                                                 // 467
  }));                                                                                     // 468
                                                                                           // 469
  var username = options.username;                                                         // 470
  var email = options.email;                                                               // 471
  if (!username && !email)                                                                 // 472
    throw new Meteor.Error(400, "Need to set a username or email");                        // 473
                                                                                           // 474
  // Raw password. The meteor client doesn't send this, but a DDP                          // 475
  // client that didn't implement SRP could send this. This should                         // 476
  // only be done over SSL.                                                                // 477
  if (options.password) {                                                                  // 478
    if (options.srp)                                                                       // 479
      throw new Meteor.Error(400, "Don't pass both password and srp in options");          // 480
    options.srp = SRP.generateVerifier(options.password);                                  // 481
  }                                                                                        // 482
                                                                                           // 483
  var user = {services: {}};                                                               // 484
  if (options.srp)                                                                         // 485
    user.services.password = {srp: options.srp}; // XXX validate verifier                  // 486
  if (username)                                                                            // 487
    user.username = username;                                                              // 488
  if (email)                                                                               // 489
    user.emails = [{address: email, verified: false}];                                     // 490
                                                                                           // 491
  return Accounts.insertUserDoc(options, user);                                            // 492
};                                                                                         // 493
                                                                                           // 494
// method for create user. Requests come from the client.                                  // 495
Meteor.methods({createUser: function (options) {                                           // 496
  // createUser() above does more checking.                                                // 497
  check(options, Object);                                                                  // 498
  options.generateLoginToken = true;                                                       // 499
  if (Accounts._options.forbidClientAccountCreation)                                       // 500
    throw new Meteor.Error(403, "Signups forbidden");                                      // 501
                                                                                           // 502
  // Create user. result contains id and token.                                            // 503
  var result = createUser(options);                                                        // 504
  // safety belt. createUser is supposed to throw on error. send 500 error                 // 505
  // instead of sending a verification email with empty userid.                            // 506
  if (!result.id)                                                                          // 507
    throw new Error("createUser failed to insert new user");                               // 508
                                                                                           // 509
  // If `Accounts._options.sendVerificationEmail` is set, register                         // 510
  // a token to verify the user's primary email, and send it to                            // 511
  // that address.                                                                         // 512
  if (options.email && Accounts._options.sendVerificationEmail)                            // 513
    Accounts.sendVerificationEmail(result.id, options.email);                              // 514
                                                                                           // 515
  // client gets logged in as the new user afterwards.                                     // 516
  this.setUserId(result.id);                                                               // 517
  this._setLoginToken(result.token);                                                       // 518
  return result;                                                                           // 519
}});                                                                                       // 520
                                                                                           // 521
// Create user directly on the server.                                                     // 522
//                                                                                         // 523
// Unlike the client version, this does not log you in as this user                        // 524
// after creation.                                                                         // 525
//                                                                                         // 526
// returns userId or throws an error if it can't create                                    // 527
//                                                                                         // 528
// XXX add another argument ("server options") that gets sent to onCreateUser,             // 529
// which is always empty when called from the createUser method? eg, "admin:               // 530
// true", which we want to prevent the client from setting, but which a custom             // 531
// method calling Accounts.createUser could set?                                           // 532
//                                                                                         // 533
Accounts.createUser = function (options, callback) {                                       // 534
  options = _.clone(options);                                                              // 535
  options.generateLoginToken = false;                                                      // 536
                                                                                           // 537
  // XXX allow an optional callback?                                                       // 538
  if (callback) {                                                                          // 539
    throw new Error("Accounts.createUser with callback not supported on the server yet."); // 540
  }                                                                                        // 541
                                                                                           // 542
  var userId = createUser(options).id;                                                     // 543
                                                                                           // 544
  return userId;                                                                           // 545
};                                                                                         // 546
                                                                                           // 547
///                                                                                        // 548
/// PASSWORD-SPECIFIC INDEXES ON USERS                                                     // 549
///                                                                                        // 550
Meteor.users._ensureIndex('emails.validationTokens.token',                                 // 551
                          {unique: 1, sparse: 1});                                         // 552
Meteor.users._ensureIndex('services.password.reset.token',                                 // 553
                          {unique: 1, sparse: 1});                                         // 554
                                                                                           // 555
/////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['accounts-password'] = {};

})();
