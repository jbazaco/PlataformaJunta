(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var Random = Package.random.Random;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var Oauth = Package.oauth.Oauth;
var _ = Package.underscore._;
var HTTP = Package.http.HTTP;

/* Package-scope variables */
var OAuth1Binding, OAuth1Test;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/oauth1/oauth1_binding.js                                                                   //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
var crypto = Npm.require("crypto");                                                                    // 1
var querystring = Npm.require("querystring");                                                          // 2
                                                                                                       // 3
// An OAuth1 wrapper around http calls which helps get tokens and                                      // 4
// takes care of HTTP headers                                                                          // 5
//                                                                                                     // 6
// @param config {Object}                                                                              // 7
//   - consumerKey (String): oauth consumer key                                                        // 8
//   - secret (String): oauth consumer secret                                                          // 9
// @param urls {Object}                                                                                // 10
//   - requestToken (String): url                                                                      // 11
//   - authorize (String): url                                                                         // 12
//   - accessToken (String): url                                                                       // 13
//   - authenticate (String): url                                                                      // 14
OAuth1Binding = function(config, urls) {                                                               // 15
  this._config = config;                                                                               // 16
  this._urls = urls;                                                                                   // 17
};                                                                                                     // 18
                                                                                                       // 19
OAuth1Binding.prototype.prepareRequestToken = function(callbackUrl) {                                  // 20
  var self = this;                                                                                     // 21
                                                                                                       // 22
  var headers = self._buildHeader({                                                                    // 23
    oauth_callback: callbackUrl                                                                        // 24
  });                                                                                                  // 25
                                                                                                       // 26
  var response = self._call('POST', self._urls.requestToken, headers);                                 // 27
  var tokens = querystring.parse(response.content);                                                    // 28
                                                                                                       // 29
  if (!tokens.oauth_callback_confirmed)                                                                // 30
    throw new Error(                                                                                   // 31
      "oauth_callback_confirmed false when requesting oauth1 token", tokens);                          // 32
                                                                                                       // 33
  self.requestToken = tokens.oauth_token;                                                              // 34
  self.requestTokenSecret = tokens.oauth_token_secret;                                                 // 35
};                                                                                                     // 36
                                                                                                       // 37
OAuth1Binding.prototype.prepareAccessToken = function(query, requestTokenSecret) {                     // 38
  var self = this;                                                                                     // 39
                                                                                                       // 40
  // support implementations that use request token secrets. This is                                   // 41
  // read by self._call.                                                                               // 42
  //                                                                                                   // 43
  // XXX make it a param to call, not something stashed on self? It's                                  // 44
  // kinda confusing right now, everything except this is passed as                                    // 45
  // arguments, but this is stored.                                                                    // 46
  if (requestTokenSecret)                                                                              // 47
    self.accessTokenSecret = requestTokenSecret;                                                       // 48
                                                                                                       // 49
  var headers = self._buildHeader({                                                                    // 50
    oauth_token: query.oauth_token                                                                     // 51
  });                                                                                                  // 52
                                                                                                       // 53
  var params = {                                                                                       // 54
    oauth_verifier: query.oauth_verifier                                                               // 55
  };                                                                                                   // 56
                                                                                                       // 57
  var response = self._call('POST', self._urls.accessToken, headers, params);                          // 58
  var tokens = querystring.parse(response.content);                                                    // 59
                                                                                                       // 60
  self.accessToken = tokens.oauth_token;                                                               // 61
  self.accessTokenSecret = tokens.oauth_token_secret;                                                  // 62
};                                                                                                     // 63
                                                                                                       // 64
OAuth1Binding.prototype.call = function(method, url, params, callback) {                               // 65
  var self = this;                                                                                     // 66
                                                                                                       // 67
  var headers = self._buildHeader({                                                                    // 68
    oauth_token: self.accessToken                                                                      // 69
  });                                                                                                  // 70
                                                                                                       // 71
  if(!params) {                                                                                        // 72
    params = {};                                                                                       // 73
  }                                                                                                    // 74
                                                                                                       // 75
  return self._call(method, url, headers, params, callback);                                           // 76
};                                                                                                     // 77
                                                                                                       // 78
OAuth1Binding.prototype.get = function(url, params, callback) {                                        // 79
  return this.call('GET', url, params, callback);                                                      // 80
};                                                                                                     // 81
                                                                                                       // 82
OAuth1Binding.prototype.post = function(url, params, callback) {                                       // 83
  return this.call('POST', url, params, callback);                                                     // 84
};                                                                                                     // 85
                                                                                                       // 86
OAuth1Binding.prototype._buildHeader = function(headers) {                                             // 87
  var self = this;                                                                                     // 88
  return _.extend({                                                                                    // 89
    oauth_consumer_key: self._config.consumerKey,                                                      // 90
    oauth_nonce: Random.id().replace(/\W/g, ''),                                                       // 91
    oauth_signature_method: 'HMAC-SHA1',                                                               // 92
    oauth_timestamp: (new Date().valueOf()/1000).toFixed().toString(),                                 // 93
    oauth_version: '1.0'                                                                               // 94
  }, headers);                                                                                         // 95
};                                                                                                     // 96
                                                                                                       // 97
OAuth1Binding.prototype._getSignature = function(method, url, rawHeaders, accessTokenSecret, params) { // 98
  var self = this;                                                                                     // 99
  var headers = self._encodeHeader(_.extend(rawHeaders, params));                                      // 100
                                                                                                       // 101
  var parameters = _.map(headers, function(val, key) {                                                 // 102
    return key + '=' + val;                                                                            // 103
  }).sort().join('&');                                                                                 // 104
                                                                                                       // 105
  var signatureBase = [                                                                                // 106
    method,                                                                                            // 107
    self._encodeString(url),                                                                           // 108
    self._encodeString(parameters)                                                                     // 109
  ].join('&');                                                                                         // 110
                                                                                                       // 111
  var signingKey = self._encodeString(self._config.secret) + '&';                                      // 112
  if (accessTokenSecret)                                                                               // 113
    signingKey += self._encodeString(accessTokenSecret);                                               // 114
                                                                                                       // 115
  return crypto.createHmac('SHA1', signingKey).update(signatureBase).digest('base64');                 // 116
};                                                                                                     // 117
                                                                                                       // 118
OAuth1Binding.prototype._call = function(method, url, headers, params, callback) {                     // 119
  var self = this;                                                                                     // 120
                                                                                                       // 121
  // all URLs to be functions to support parameters/customization                                      // 122
  if(typeof url === "function") {                                                                      // 123
    url = url(self);                                                                                   // 124
  }                                                                                                    // 125
                                                                                                       // 126
  // Get the signature                                                                                 // 127
  headers.oauth_signature =                                                                            // 128
    self._getSignature(method, url, headers, self.accessTokenSecret, params);                          // 129
                                                                                                       // 130
  // Make a authorization string according to oauth1 spec                                              // 131
  var authString = self._getAuthHeaderString(headers);                                                 // 132
                                                                                                       // 133
  // Make signed request                                                                               // 134
  try {                                                                                                // 135
    return HTTP.call(method, url, {                                                                    // 136
      params: params,                                                                                  // 137
      headers: {                                                                                       // 138
        Authorization: authString                                                                      // 139
      }                                                                                                // 140
    }, callback);                                                                                      // 141
  } catch (err) {                                                                                      // 142
    throw _.extend(new Error("Failed to send OAuth1 request to " + url + ". " + err.message),          // 143
                   {response: err.response});                                                          // 144
  }                                                                                                    // 145
};                                                                                                     // 146
                                                                                                       // 147
OAuth1Binding.prototype._encodeHeader = function(header) {                                             // 148
  var self = this;                                                                                     // 149
  return _.reduce(header, function(memo, val, key) {                                                   // 150
    memo[self._encodeString(key)] = self._encodeString(val);                                           // 151
    return memo;                                                                                       // 152
  }, {});                                                                                              // 153
};                                                                                                     // 154
                                                                                                       // 155
OAuth1Binding.prototype._encodeString = function(str) {                                                // 156
  return encodeURIComponent(str).replace(/[!'()]/g, escape).replace(/\*/g, "%2A");                     // 157
};                                                                                                     // 158
                                                                                                       // 159
OAuth1Binding.prototype._getAuthHeaderString = function(headers) {                                     // 160
  var self = this;                                                                                     // 161
  return 'OAuth ' +  _.map(headers, function(val, key) {                                               // 162
    return self._encodeString(key) + '="' + self._encodeString(val) + '"';                             // 163
  }).sort().join(', ');                                                                                // 164
};                                                                                                     // 165
                                                                                                       // 166
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/oauth1/oauth1_server.js                                                                    //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
// A place to store request tokens pending verification                                                // 1
var requestTokens = {};                                                                                // 2
                                                                                                       // 3
OAuth1Test = {requestTokens: requestTokens};                                                           // 4
                                                                                                       // 5
// connect middleware                                                                                  // 6
Oauth._requestHandlers['1'] = function (service, query, res) {                                         // 7
                                                                                                       // 8
  var config = ServiceConfiguration.configurations.findOne({service: service.serviceName});            // 9
  if (!config) {                                                                                       // 10
    throw new ServiceConfiguration.ConfigError("Service " + service.serviceName + " not configured");  // 11
  }                                                                                                    // 12
                                                                                                       // 13
  var urls = service.urls;                                                                             // 14
  var oauthBinding = new OAuth1Binding(config, urls);                                                  // 15
                                                                                                       // 16
  if (query.requestTokenAndRedirect) {                                                                 // 17
    // step 1 - get and store a request token                                                          // 18
                                                                                                       // 19
    // Get a request token to start auth process                                                       // 20
    oauthBinding.prepareRequestToken(query.requestTokenAndRedirect);                                   // 21
                                                                                                       // 22
    // Keep track of request token so we can verify it on the next step                                // 23
    requestTokens[query.state] = {                                                                     // 24
      requestToken: oauthBinding.requestToken,                                                         // 25
      requestTokenSecret: oauthBinding.requestTokenSecret                                              // 26
    };                                                                                                 // 27
                                                                                                       // 28
    // support for scope/name parameters                                                               // 29
    var redirectUrl = undefined;                                                                       // 30
    if(typeof urls.authenticate === "function") {                                                      // 31
      redirectUrl = urls.authenticate(oauthBinding);                                                   // 32
    } else {                                                                                           // 33
      redirectUrl = urls.authenticate + '?oauth_token=' + oauthBinding.requestToken;                   // 34
    }                                                                                                  // 35
                                                                                                       // 36
    // redirect to provider login, which will redirect back to "step 2" below                          // 37
    res.writeHead(302, {'Location': redirectUrl});                                                     // 38
    res.end();                                                                                         // 39
  } else {                                                                                             // 40
    // step 2, redirected from provider login - complete the login                                     // 41
    // process: if the user authorized permissions, get an access                                      // 42
    // token and access token secret and log in as user                                                // 43
                                                                                                       // 44
    // Get the user's request token so we can verify it and clear it                                   // 45
    var requestToken = requestTokens[query.state].requestToken;                                        // 46
    var requestTokenSecret = requestTokens[query.state].requestTokenSecret;                            // 47
    delete requestTokens[query.state];                                                                 // 48
                                                                                                       // 49
    // Verify user authorized access and the oauth_token matches                                       // 50
    // the requestToken from previous step                                                             // 51
    if (query.oauth_token && query.oauth_token === requestToken) {                                     // 52
                                                                                                       // 53
      // Prepare the login results before returning.  This way the                                     // 54
      // subsequent call to the `login` method will be immediate.                                      // 55
                                                                                                       // 56
      // Get the access token for signing requests                                                     // 57
      oauthBinding.prepareAccessToken(query, requestTokenSecret);                                      // 58
                                                                                                       // 59
      // Run service-specific handler.                                                                 // 60
      var oauthResult = service.handleOauthRequest(oauthBinding);                                      // 61
                                                                                                       // 62
      // Add the login result to the result map                                                        // 63
      Oauth._loginResultForCredentialToken[query.state] = {                                            // 64
        serviceName: service.serviceName,                                                              // 65
        serviceData: oauthResult.serviceData,                                                          // 66
        options: oauthResult.options                                                                   // 67
      };                                                                                               // 68
    }                                                                                                  // 69
                                                                                                       // 70
    // Either close the window, redirect, or render nothing                                            // 71
    // if all else fails                                                                               // 72
    Oauth._renderOauthResults(res, query);                                                             // 73
  }                                                                                                    // 74
};                                                                                                     // 75
                                                                                                       // 76
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.oauth1 = {
  OAuth1Binding: OAuth1Binding,
  OAuth1Test: OAuth1Test
};

})();
