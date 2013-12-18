(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var _ = Package.underscore._;
var AppConfig = Package['application-configuration'].AppConfig;

/* Package-scope variables */
var Email, EmailTest;

(function () {

/////////////////////////////////////////////////////////////////////////////////
//                                                                             //
// packages/email/email.js                                                     //
//                                                                             //
/////////////////////////////////////////////////////////////////////////////////
                                                                               //
var Future = Npm.require('fibers/future');                                     // 1
var urlModule = Npm.require('url');                                            // 2
var MailComposer = Npm.require('mailcomposer').MailComposer;                   // 3
                                                                               // 4
Email = {};                                                                    // 5
EmailTest = {};                                                                // 6
                                                                               // 7
var makePool = function (mailUrlString) {                                      // 8
  var mailUrl = urlModule.parse(mailUrlString);                                // 9
  if (mailUrl.protocol !== 'smtp:')                                            // 10
    throw new Error("Email protocol in $MAIL_URL (" +                          // 11
                    mailUrlString + ") must be 'smtp'");                       // 12
                                                                               // 13
  var port = +(mailUrl.port);                                                  // 14
  var auth = false;                                                            // 15
  if (mailUrl.auth) {                                                          // 16
    var parts = mailUrl.auth.split(':', 2);                                    // 17
    auth = {user: parts[0] && decodeURIComponent(parts[0]),                    // 18
            pass: parts[1] && decodeURIComponent(parts[1])};                   // 19
  }                                                                            // 20
                                                                               // 21
  var simplesmtp = Npm.require('simplesmtp');                                  // 22
  var pool = simplesmtp.createClientPool(                                      // 23
    port,  // Defaults to 25                                                   // 24
    mailUrl.hostname,  // Defaults to "localhost"                              // 25
    { secureConnection: (port === 465),                                        // 26
      // XXX allow maxConnections to be configured?                            // 27
      auth: auth });                                                           // 28
                                                                               // 29
  pool._future_wrapped_sendMail = _.bind(Future.wrap(pool.sendMail), pool);    // 30
  return pool;                                                                 // 31
};                                                                             // 32
                                                                               // 33
// We construct smtpPool at the first call to Email.send, so that              // 34
// Meteor.startup code can set $MAIL_URL.                                      // 35
var smtpPool = null;                                                           // 36
var maybeMakePool = function () {                                              // 37
  // We check MAIL_URL in case someone else set it in Meteor.startup code.     // 38
  var poolFuture = new Future();                                               // 39
  AppConfig.configurePackage('email', function (config) {                      // 40
    // TODO: allow reconfiguration.                                            // 41
    if (!smtpPool && (config.url || process.env.MAIL_URL)) {                   // 42
      smtpPool = makePool(config.url || process.env.MAIL_URL);                 // 43
    }                                                                          // 44
    poolFuture.return();                                                       // 45
  });                                                                          // 46
                                                                               // 47
  poolFuture.wait();                                                           // 48
};                                                                             // 49
                                                                               // 50
var next_devmode_mail_id = 0;                                                  // 51
var output_stream = process.stdout;                                            // 52
                                                                               // 53
// Testing hooks                                                               // 54
EmailTest.overrideOutputStream = function (stream) {                           // 55
  next_devmode_mail_id = 0;                                                    // 56
  output_stream = stream;                                                      // 57
};                                                                             // 58
                                                                               // 59
EmailTest.restoreOutputStream = function () {                                  // 60
  output_stream = process.stdout;                                              // 61
};                                                                             // 62
                                                                               // 63
var devModeSend = function (mc) {                                              // 64
  var devmode_mail_id = next_devmode_mail_id++;                                // 65
                                                                               // 66
  // Make sure we use whatever stream was set at the time of the Email.send    // 67
  // call even in the 'end' callback, in case there are multiple concurrent    // 68
  // test runs.                                                                // 69
  var stream = output_stream;                                                  // 70
                                                                               // 71
  // This approach does not prevent other writers to stdout from interleaving. // 72
  stream.write("====== BEGIN MAIL #" + devmode_mail_id + " ======\n");         // 73
  mc.streamMessage();                                                          // 74
  mc.pipe(stream, {end: false});                                               // 75
  var future = new Future;                                                     // 76
  mc.on('end', function () {                                                   // 77
    stream.write("====== END MAIL #" + devmode_mail_id + " ======\n");         // 78
    future['return']();                                                        // 79
  });                                                                          // 80
  future.wait();                                                               // 81
};                                                                             // 82
                                                                               // 83
var smtpSend = function (mc) {                                                 // 84
  smtpPool._future_wrapped_sendMail(mc).wait();                                // 85
};                                                                             // 86
                                                                               // 87
/**                                                                            // 88
 * Mock out email sending (eg, during a test.) This is private for now.        // 89
 *                                                                             // 90
 * f receives the arguments to Email.send and should return true to go         // 91
 * ahead and send the email (or at least, try subsequent hooks), or            // 92
 * false to skip sending.                                                      // 93
 */                                                                            // 94
var sendHooks = [];                                                            // 95
EmailTest.hookSend = function (f) {                                            // 96
  sendHooks.push(f);                                                           // 97
};                                                                             // 98
                                                                               // 99
/**                                                                            // 100
 * Send an email.                                                              // 101
 *                                                                             // 102
 * Connects to the mail server configured via the MAIL_URL environment         // 103
 * variable. If unset, prints formatted message to stdout. The "from" option   // 104
 * is required, and at least one of "to", "cc", and "bcc" must be provided;    // 105
 * all other options are optional.                                             // 106
 *                                                                             // 107
 * @param options                                                              // 108
 * @param options.from {String} RFC5322 "From:" address                        // 109
 * @param options.to {String|String[]} RFC5322 "To:" address[es]               // 110
 * @param options.cc {String|String[]} RFC5322 "Cc:" address[es]               // 111
 * @param options.bcc {String|String[]} RFC5322 "Bcc:" address[es]             // 112
 * @param options.replyTo {String|String[]} RFC5322 "Reply-To:" address[es]    // 113
 * @param options.subject {String} RFC5322 "Subject:" line                     // 114
 * @param options.text {String} RFC5322 mail body (plain text)                 // 115
 * @param options.html {String} RFC5322 mail body (HTML)                       // 116
 * @param options.headers {Object} custom RFC5322 headers (dictionary)         // 117
 */                                                                            // 118
Email.send = function (options) {                                              // 119
  for (var i = 0; i < sendHooks.length; i++)                                   // 120
    if (! sendHooks[i](options))                                               // 121
      return;                                                                  // 122
                                                                               // 123
  var mc = new MailComposer();                                                 // 124
                                                                               // 125
  // setup message data                                                        // 126
  // XXX support attachments (once we have a client/server-compatible binary   // 127
  //     Buffer class)                                                         // 128
  mc.setMessageOption({                                                        // 129
    from: options.from,                                                        // 130
    to: options.to,                                                            // 131
    cc: options.cc,                                                            // 132
    bcc: options.bcc,                                                          // 133
    replyTo: options.replyTo,                                                  // 134
    subject: options.subject,                                                  // 135
    text: options.text,                                                        // 136
    html: options.html                                                         // 137
  });                                                                          // 138
                                                                               // 139
  _.each(options.headers, function (value, name) {                             // 140
    mc.addHeader(name, value);                                                 // 141
  });                                                                          // 142
                                                                               // 143
  maybeMakePool();                                                             // 144
                                                                               // 145
  if (smtpPool) {                                                              // 146
    smtpSend(mc);                                                              // 147
  } else {                                                                     // 148
    devModeSend(mc);                                                           // 149
  }                                                                            // 150
};                                                                             // 151
                                                                               // 152
/////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.email = {
  Email: Email,
  EmailTest: EmailTest
};

})();
