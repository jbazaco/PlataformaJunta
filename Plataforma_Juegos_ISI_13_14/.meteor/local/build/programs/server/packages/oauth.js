(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var RoutePolicy = Package.routepolicy.RoutePolicy;
var WebApp = Package.webapp.WebApp;
var main = Package.webapp.main;
var WebAppInternals = Package.webapp.WebAppInternals;
var _ = Package.underscore._;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;

/* Package-scope variables */
var Oauth, OauthTest, middleware;

(function () {

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/oauth/oauth_server.js                                                       //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
var Fiber = Npm.require('fibers');                                                      // 1
                                                                                        // 2
Oauth = {};                                                                             // 3
OauthTest = {};                                                                         // 4
                                                                                        // 5
RoutePolicy.declare('/_oauth/', 'network');                                             // 6
                                                                                        // 7
var registeredServices = {};                                                            // 8
                                                                                        // 9
// Internal: Maps from service version to handler function. The                         // 10
// 'oauth1' and 'oauth2' packages manipulate this directly to register                  // 11
// for callbacks.                                                                       // 12
//                                                                                      // 13
Oauth._requestHandlers = {};                                                            // 14
                                                                                        // 15
                                                                                        // 16
// Register a handler for an OAuth service. The handler will be called                  // 17
// when we get an incoming http request on /_oauth/{serviceName}. This                  // 18
// handler should use that information to fetch data about the user                     // 19
// logging in.                                                                          // 20
//                                                                                      // 21
// @param name {String} e.g. "google", "facebook"                                       // 22
// @param version {Number} OAuth version (1 or 2)                                       // 23
// @param urls   For OAuth1 only, specify the service's urls                            // 24
// @param handleOauthRequest {Function(oauthBinding|query)}                             // 25
//   - (For OAuth1 only) oauthBinding {OAuth1Binding} bound to the appropriate provider // 26
//   - (For OAuth2 only) query {Object} parameters passed in query string               // 27
//   - return value is:                                                                 // 28
//     - {serviceData:, (optional options:)} where serviceData should end               // 29
//       up in the user's services[name] field                                          // 30
//     - `null` if the user declined to give permissions                                // 31
//                                                                                      // 32
Oauth.registerService = function (name, version, urls, handleOauthRequest) {            // 33
  if (registeredServices[name])                                                         // 34
    throw new Error("Already registered the " + name + " OAuth service");               // 35
                                                                                        // 36
  registeredServices[name] = {                                                          // 37
    serviceName: name,                                                                  // 38
    version: version,                                                                   // 39
    urls: urls,                                                                         // 40
    handleOauthRequest: handleOauthRequest                                              // 41
  };                                                                                    // 42
};                                                                                      // 43
                                                                                        // 44
// For test cleanup.                                                                    // 45
OauthTest.unregisterService = function (name) {                                         // 46
  delete registeredServices[name];                                                      // 47
};                                                                                      // 48
                                                                                        // 49
                                                                                        // 50
// When we get an incoming OAuth http request we complete the oauth                     // 51
// handshake, account and token setup before responding.  The                           // 52
// results are stored in this map which is then read when the login                     // 53
// method is called. Maps credentialToken --> return value of `login`                   // 54
//                                                                                      // 55
// NB: the oauth1 and oauth2 packages manipulate this directly. might                   // 56
// be nice for them to have a setter instead                                            // 57
//                                                                                      // 58
// XXX we should periodically clear old entries                                         // 59
//                                                                                      // 60
Oauth._loginResultForCredentialToken = {};                                              // 61
                                                                                        // 62
Oauth.hasCredential = function(credentialToken) {                                       // 63
  return _.has(Oauth._loginResultForCredentialToken, credentialToken);                  // 64
}                                                                                       // 65
                                                                                        // 66
Oauth.retrieveCredential = function(credentialToken) {                                  // 67
  var result = Oauth._loginResultForCredentialToken[credentialToken];                   // 68
  delete Oauth._loginResultForCredentialToken[credentialToken];                         // 69
  return result;                                                                        // 70
}                                                                                       // 71
                                                                                        // 72
// Listen to incoming OAuth http requests                                               // 73
WebApp.connectHandlers.use(function(req, res, next) {                                   // 74
  // Need to create a Fiber since we're using synchronous http calls and nothing        // 75
  // else is wrapping this in a fiber automatically                                     // 76
  Fiber(function () {                                                                   // 77
    middleware(req, res, next);                                                         // 78
  }).run();                                                                             // 79
});                                                                                     // 80
                                                                                        // 81
middleware = function (req, res, next) {                                                // 82
  // Make sure to catch any exceptions because otherwise we'd crash                     // 83
  // the runner                                                                         // 84
  try {                                                                                 // 85
    var serviceName = oauthServiceName(req);                                            // 86
    if (!serviceName) {                                                                 // 87
      // not an oauth request. pass to next middleware.                                 // 88
      next();                                                                           // 89
      return;                                                                           // 90
    }                                                                                   // 91
                                                                                        // 92
    var service = registeredServices[serviceName];                                      // 93
                                                                                        // 94
    // Skip everything if there's no service set by the oauth middleware                // 95
    if (!service)                                                                       // 96
      throw new Error("Unexpected OAuth service " + serviceName);                       // 97
                                                                                        // 98
    // Make sure we're configured                                                       // 99
    ensureConfigured(serviceName);                                                      // 100
                                                                                        // 101
    var handler = Oauth._requestHandlers[service.version];                              // 102
    if (!handler)                                                                       // 103
      throw new Error("Unexpected OAuth version " + service.version);                   // 104
    handler(service, req.query, res);                                                   // 105
  } catch (err) {                                                                       // 106
    // if we got thrown an error, save it off, it will get passed to                    // 107
    // the approporiate login call (if any) and reported there.                         // 108
    //                                                                                  // 109
    // The other option would be to display it in the popup tab that                    // 110
    // is still open at this point, ignoring the 'close' or 'redirect'                  // 111
    // we were passed. But then the developer wouldn't be able to                       // 112
    // style the error or react to it in any way.                                       // 113
    if (req.query.state && err instanceof Error)                                        // 114
      Oauth._loginResultForCredentialToken[req.query.state] = err;                      // 115
                                                                                        // 116
    // XXX the following is actually wrong. if someone wants to                         // 117
    // redirect rather than close once we are done with the OAuth                       // 118
    // flow, as supported by                                                            // 119
    // Oauth_renderOauthResults, this will still                                        // 120
    // close the popup instead. Once we fully support the redirect                      // 121
    // flow (by supporting that in places such as                                       // 122
    // packages/facebook/facebook_client.js) we should revisit this.                    // 123
    //                                                                                  // 124
    // close the popup. because nobody likes them just hanging                          // 125
    // there.  when someone sees this multiple times they might                         // 126
    // think to check server logs (we hope?)                                            // 127
    closePopup(res);                                                                    // 128
  }                                                                                     // 129
};                                                                                      // 130
                                                                                        // 131
OauthTest.middleware = middleware;                                                      // 132
                                                                                        // 133
// Handle /_oauth/* paths and extract the service name                                  // 134
//                                                                                      // 135
// @returns {String|null} e.g. "facebook", or null if this isn't an                     // 136
// oauth request                                                                        // 137
var oauthServiceName = function (req) {                                                 // 138
  // req.url will be "/_oauth/<service name>?<action>"                                  // 139
  var barePath = req.url.substring(0, req.url.indexOf('?'));                            // 140
  var splitPath = barePath.split('/');                                                  // 141
                                                                                        // 142
  // Any non-oauth request will continue down the default                               // 143
  // middlewares.                                                                       // 144
  if (splitPath[1] !== '_oauth')                                                        // 145
    return null;                                                                        // 146
                                                                                        // 147
  // Find service based on url                                                          // 148
  var serviceName = splitPath[2];                                                       // 149
  return serviceName;                                                                   // 150
};                                                                                      // 151
                                                                                        // 152
// Make sure we're configured                                                           // 153
var ensureConfigured = function(serviceName) {                                          // 154
  if (!ServiceConfiguration.configurations.findOne({service: serviceName})) {           // 155
    throw new ServiceConfiguration.ConfigError("Service not configured");               // 156
  };                                                                                    // 157
};                                                                                      // 158
                                                                                        // 159
// Internal: used by the oauth1 and oauth2 packages                                     // 160
Oauth._renderOauthResults = function(res, query) {                                      // 161
  // We support ?close and ?redirect=URL. Any other query should                        // 162
  // just serve a blank page                                                            // 163
  if ('close' in query) { // check with 'in' because we don't set a value               // 164
    closePopup(res);                                                                    // 165
  } else if (query.redirect) {                                                          // 166
    res.writeHead(302, {'Location': query.redirect});                                   // 167
    res.end();                                                                          // 168
  } else {                                                                              // 169
    res.writeHead(200, {'Content-Type': 'text/html'});                                  // 170
    res.end('', 'utf-8');                                                               // 171
  }                                                                                     // 172
};                                                                                      // 173
                                                                                        // 174
var closePopup = function(res) {                                                        // 175
  res.writeHead(200, {'Content-Type': 'text/html'});                                    // 176
  var content =                                                                         // 177
        '<html><head><script>window.close()</script></head></html>';                    // 178
  res.end(content, 'utf-8');                                                            // 179
};                                                                                      // 180
                                                                                        // 181
                                                                                        // 182
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.oauth = {
  Oauth: Oauth,
  OauthTest: OauthTest
};

})();
