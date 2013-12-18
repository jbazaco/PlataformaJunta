(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var Log = Package.logging.Log;
var _ = Package.underscore._;
var RoutePolicy = Package.routepolicy.RoutePolicy;

/* Package-scope variables */
var WebApp, main, WebAppInternals;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/webapp/webapp_server.js                                                                        //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
////////// Requires //////////                                                                             // 1
                                                                                                           // 2
var fs = Npm.require("fs");                                                                                // 3
var http = Npm.require("http");                                                                            // 4
var os = Npm.require("os");                                                                                // 5
var path = Npm.require("path");                                                                            // 6
var url = Npm.require("url");                                                                              // 7
var crypto = Npm.require("crypto");                                                                        // 8
                                                                                                           // 9
var connect = Npm.require('connect');                                                                      // 10
var optimist = Npm.require('optimist');                                                                    // 11
var useragent = Npm.require('useragent');                                                                  // 12
var send = Npm.require('send');                                                                            // 13
                                                                                                           // 14
WebApp = {};                                                                                               // 15
WebAppInternals = {};                                                                                      // 16
                                                                                                           // 17
// Keepalives so that when the outer server dies unceremoniously and                                       // 18
// doesn't kill us, we quit ourselves. A little gross, but better than                                     // 19
// pidfiles.                                                                                               // 20
// XXX This should really be part of the boot script, not the webapp package.                              // 21
//     Or we should just get rid of it, and rely on containerization.                                      // 22
                                                                                                           // 23
var initKeepalive = function () {                                                                          // 24
  var keepaliveCount = 0;                                                                                  // 25
                                                                                                           // 26
  process.stdin.on('data', function (data) {                                                               // 27
    keepaliveCount = 0;                                                                                    // 28
  });                                                                                                      // 29
                                                                                                           // 30
  process.stdin.resume();                                                                                  // 31
                                                                                                           // 32
  setInterval(function () {                                                                                // 33
    keepaliveCount ++;                                                                                     // 34
    if (keepaliveCount >= 3) {                                                                             // 35
      console.log("Failed to receive keepalive! Exiting.");                                                // 36
      process.exit(1);                                                                                     // 37
    }                                                                                                      // 38
  }, 3000);                                                                                                // 39
};                                                                                                         // 40
                                                                                                           // 41
                                                                                                           // 42
var sha1 = function (contents) {                                                                           // 43
  var hash = crypto.createHash('sha1');                                                                    // 44
  hash.update(contents);                                                                                   // 45
  return hash.digest('hex');                                                                               // 46
};                                                                                                         // 47
                                                                                                           // 48
// #BrowserIdentification                                                                                  // 49
//                                                                                                         // 50
// We have multiple places that want to identify the browser: the                                          // 51
// unsupported browser page, the appcache package, and, eventually                                         // 52
// delivering browser polyfills only as needed.                                                            // 53
//                                                                                                         // 54
// To avoid detecting the browser in multiple places ad-hoc, we create a                                   // 55
// Meteor "browser" object. It uses but does not expose the npm                                            // 56
// useragent module (we could choose a different mechanism to identify                                     // 57
// the browser in the future if we wanted to).  The browser object                                         // 58
// contains                                                                                                // 59
//                                                                                                         // 60
// * `name`: the name of the browser in camel case                                                         // 61
// * `major`, `minor`, `patch`: integers describing the browser version                                    // 62
//                                                                                                         // 63
// Also here is an early version of a Meteor `request` object, intended                                    // 64
// to be a high-level description of the request without exposing                                          // 65
// details of connect's low-level `req`.  Currently it contains:                                           // 66
//                                                                                                         // 67
// * `browser`: browser identification object described above                                              // 68
// * `url`: parsed url, including parsed query params                                                      // 69
//                                                                                                         // 70
// As a temporary hack there is a `categorizeRequest` function on WebApp which                             // 71
// converts a connect `req` to a Meteor `request`. This can go away once smart                             // 72
// packages such as appcache are being passed a `request` object directly when                             // 73
// they serve content.                                                                                     // 74
//                                                                                                         // 75
// This allows `request` to be used uniformly: it is passed to the html                                    // 76
// attributes hook, and the appcache package can use it when deciding                                      // 77
// whether to generate a 404 for the manifest.                                                             // 78
//                                                                                                         // 79
// Real routing / server side rendering will probably refactor this                                        // 80
// heavily.                                                                                                // 81
                                                                                                           // 82
                                                                                                           // 83
// e.g. "Mobile Safari" => "mobileSafari"                                                                  // 84
var camelCase = function (name) {                                                                          // 85
  var parts = name.split(' ');                                                                             // 86
  parts[0] = parts[0].toLowerCase();                                                                       // 87
  for (var i = 1;  i < parts.length;  ++i) {                                                               // 88
    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substr(1);                                      // 89
  }                                                                                                        // 90
  return parts.join('');                                                                                   // 91
};                                                                                                         // 92
                                                                                                           // 93
var identifyBrowser = function (req) {                                                                     // 94
  var userAgent = useragent.lookup(req.headers['user-agent']);                                             // 95
  return {                                                                                                 // 96
    name: camelCase(userAgent.family),                                                                     // 97
    major: +userAgent.major,                                                                               // 98
    minor: +userAgent.minor,                                                                               // 99
    patch: +userAgent.patch                                                                                // 100
  };                                                                                                       // 101
};                                                                                                         // 102
                                                                                                           // 103
WebApp.categorizeRequest = function (req) {                                                                // 104
  return {                                                                                                 // 105
    browser: identifyBrowser(req),                                                                         // 106
    url: url.parse(req.url, true)                                                                          // 107
  };                                                                                                       // 108
};                                                                                                         // 109
                                                                                                           // 110
// HTML attribute hooks: functions to be called to determine any attributes to                             // 111
// be added to the '<html>' tag. Each function is passed a 'request' object (see                           // 112
// #BrowserIdentification) and should return a string,                                                     // 113
var htmlAttributeHooks = [];                                                                               // 114
var htmlAttributes = function (template, request) {                                                        // 115
  var attributes = '';                                                                                     // 116
  _.each(htmlAttributeHooks || [], function (hook) {                                                       // 117
    var attribute = hook(request);                                                                         // 118
    if (attribute !== null && attribute !== undefined && attribute !== '')                                 // 119
      attributes += ' ' + attribute;                                                                       // 120
  });                                                                                                      // 121
  return template.replace('##HTML_ATTRIBUTES##', attributes);                                              // 122
};                                                                                                         // 123
WebApp.addHtmlAttributeHook = function (hook) {                                                            // 124
  htmlAttributeHooks.push(hook);                                                                           // 125
};                                                                                                         // 126
                                                                                                           // 127
// Serve app HTML for this URL?                                                                            // 128
var appUrl = function (url) {                                                                              // 129
  if (url === '/favicon.ico' || url === '/robots.txt')                                                     // 130
    return false;                                                                                          // 131
                                                                                                           // 132
  // NOTE: app.manifest is not a web standard like favicon.ico and                                         // 133
  // robots.txt. It is a file name we have chosen to use for HTML5                                         // 134
  // appcache URLs. It is included here to prevent using an appcache                                       // 135
  // then removing it from poisoning an app permanently. Eventually,                                       // 136
  // once we have server side routing, this won't be needed as                                             // 137
  // unknown URLs with return a 404 automatically.                                                         // 138
  if (url === '/app.manifest')                                                                             // 139
    return false;                                                                                          // 140
                                                                                                           // 141
  // Avoid serving app HTML for declared routes such as /sockjs/.                                          // 142
  if (RoutePolicy.classify(url))                                                                           // 143
    return false;                                                                                          // 144
                                                                                                           // 145
  // we currently return app HTML on all URLs by default                                                   // 146
  return true;                                                                                             // 147
};                                                                                                         // 148
                                                                                                           // 149
var runWebAppServer = function () {                                                                        // 150
  // read the control for the client we'll be serving up                                                   // 151
  var clientJsonPath = path.join(__meteor_bootstrap__.serverDir,                                           // 152
                                 __meteor_bootstrap__.configJson.client);                                  // 153
  var clientDir = path.dirname(clientJsonPath);                                                            // 154
  var clientJson = JSON.parse(fs.readFileSync(clientJsonPath, 'utf8'));                                    // 155
                                                                                                           // 156
  if (clientJson.format !== "browser-program-pre1")                                                        // 157
    throw new Error("Unsupported format for client assets: " +                                             // 158
                    JSON.stringify(clientJson.format));                                                    // 159
                                                                                                           // 160
  // webserver                                                                                             // 161
  var app = connect();                                                                                     // 162
                                                                                                           // 163
  // Strip off the path prefix, if it exists.                                                              // 164
  app.use(function (request, response, next) {                                                             // 165
    var pathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;                                       // 166
    var url = Npm.require('url').parse(request.url);                                                       // 167
    var pathname = url.pathname;                                                                           // 168
    // check if the path in the url starts with the path prefix (and the part                              // 169
    // after the path prefix must start with a / if it exists.)                                            // 170
    if (pathPrefix && pathname.substring(0, pathPrefix.length) === pathPrefix &&                           // 171
       (pathname.length == pathPrefix.length                                                               // 172
        || pathname.substring(pathPrefix.length, pathPrefix.length + 1) === "/")) {                        // 173
      request.url = request.url.substring(pathPrefix.length);                                              // 174
      next();                                                                                              // 175
    } else if (pathname === "/favicon.ico" || pathname === "/robots.txt") {                                // 176
      next();                                                                                              // 177
    } else if (pathPrefix) {                                                                               // 178
      response.writeHead(404);                                                                             // 179
      response.write("Unknown path");                                                                      // 180
      response.end();                                                                                      // 181
    } else {                                                                                               // 182
      next();                                                                                              // 183
    }                                                                                                      // 184
  });                                                                                                      // 185
  // Parse the query string into res.query. Used by oauth_server, but it's                                 // 186
  // generally pretty handy..                                                                              // 187
  app.use(connect.query());                                                                                // 188
                                                                                                           // 189
  // Auto-compress any json, javascript, or text.                                                          // 190
  app.use(connect.compress());                                                                             // 191
                                                                                                           // 192
  var getItemPathname = function (itemUrl) {                                                               // 193
    return decodeURIComponent(url.parse(itemUrl).pathname);                                                // 194
  };                                                                                                       // 195
                                                                                                           // 196
  var staticFiles = {};                                                                                    // 197
  _.each(clientJson.manifest, function (item) {                                                            // 198
    if (item.url && item.where === "client") {                                                             // 199
      staticFiles[getItemPathname(item.url)] = {                                                           // 200
        path: item.path,                                                                                   // 201
        cacheable: item.cacheable,                                                                         // 202
        // Link from source to its map                                                                     // 203
        sourceMapUrl: item.sourceMapUrl                                                                    // 204
      };                                                                                                   // 205
                                                                                                           // 206
      if (item.sourceMap) {                                                                                // 207
        // Serve the source map too, under the specified URL. We assume all                                // 208
        // source maps are cacheable.                                                                      // 209
        staticFiles[getItemPathname(item.sourceMapUrl)] = {                                                // 210
          path: item.sourceMap,                                                                            // 211
          cacheable: true                                                                                  // 212
        };                                                                                                 // 213
      }                                                                                                    // 214
    }                                                                                                      // 215
  });                                                                                                      // 216
                                                                                                           // 217
  // Serve static files from the manifest.                                                                 // 218
  // This is inspired by the 'static' middleware.                                                          // 219
  app.use(function (req, res, next) {                                                                      // 220
    if ('GET' != req.method && 'HEAD' != req.method) {                                                     // 221
      next();                                                                                              // 222
      return;                                                                                              // 223
    }                                                                                                      // 224
    var pathname = connect.utils.parseUrl(req).pathname;                                                   // 225
                                                                                                           // 226
    try {                                                                                                  // 227
      pathname = decodeURIComponent(pathname);                                                             // 228
    } catch (e) {                                                                                          // 229
      next();                                                                                              // 230
      return;                                                                                              // 231
    }                                                                                                      // 232
                                                                                                           // 233
    var browserPolicyPackage = Package["browser-policy-common"];                                           // 234
    if (pathname === "/meteor_runtime_config.js" &&                                                        // 235
        browserPolicyPackage &&                                                                            // 236
        browserPolicyPackage.BrowserPolicy.content &&                                                      // 237
        ! browserPolicyPackage.BrowserPolicy.content.inlineScriptsAllowed()) {                             // 238
      res.writeHead(200, { 'Content-type': 'application/javascript' });                                    // 239
      res.write("__meteor_runtime_config__ = " +                                                           // 240
                JSON.stringify(__meteor_runtime_config__) + ";");                                          // 241
      res.end();                                                                                           // 242
      return;                                                                                              // 243
    }                                                                                                      // 244
                                                                                                           // 245
    if (!_.has(staticFiles, pathname)) {                                                                   // 246
      next();                                                                                              // 247
      return;                                                                                              // 248
    }                                                                                                      // 249
                                                                                                           // 250
    // We don't need to call pause because, unlike 'static', once we call into                             // 251
    // 'send' and yield to the event loop, we never call another handler with                              // 252
    // 'next'.                                                                                             // 253
                                                                                                           // 254
    var info = staticFiles[pathname];                                                                      // 255
                                                                                                           // 256
    // Cacheable files are files that should never change. Typically                                       // 257
    // named by their hash (eg meteor bundled js and css files).                                           // 258
    // We cache them ~forever (1yr).                                                                       // 259
    //                                                                                                     // 260
    // We cache non-cacheable files anyway. This isn't really correct, as users                            // 261
    // can change the files and changes won't propagate immediately. However, if                           // 262
    // we don't cache them, browsers will 'flicker' when rerendering                                       // 263
    // images. Eventually we will probably want to rewrite URLs of static assets                           // 264
    // to include a query parameter to bust caches. That way we can both get                               // 265
    // good caching behavior and allow users to change assets without delay.                               // 266
    // https://github.com/meteor/meteor/issues/773                                                         // 267
    var maxAge = info.cacheable                                                                            // 268
          ? 1000 * 60 * 60 * 24 * 365                                                                      // 269
          : 1000 * 60 * 60 * 24;                                                                           // 270
                                                                                                           // 271
    // Set the X-SourceMap header, which current Chrome understands.                                       // 272
    // (The files also contain '//#' comments which FF 24 understands and                                  // 273
    // Chrome doesn't understand yet.)                                                                     // 274
    //                                                                                                     // 275
    // Eventually we should set the SourceMap header but the current version of                            // 276
    // Chrome and no version of FF supports it.                                                            // 277
    //                                                                                                     // 278
    // To figure out if your version of Chrome should support the SourceMap                                // 279
    // header,                                                                                             // 280
    //   - go to chrome://version. Let's say the Chrome version is                                         // 281
    //      28.0.1500.71 and the Blink version is 537.36 (@153022)                                         // 282
    //   - go to http://src.chromium.org/viewvc/blink/branches/chromium/1500/Source/core/inspector/InspectorPageAgent.cpp?view=log
    //     where the "1500" is the third part of your Chrome version                                       // 284
    //   - find the first revision that is no greater than the "153022"                                    // 285
    //     number.  That's probably the first one and it probably has                                      // 286
    //     a message of the form "Branch 1500 - blink@r149738"                                             // 287
    //   - If *that* revision number (149738) is at least 151755,                                          // 288
    //     then Chrome should support SourceMap (not just X-SourceMap)                                     // 289
    // (The change is https://codereview.chromium.org/15832007)                                            // 290
    //                                                                                                     // 291
    // You also need to enable source maps in Chrome: open dev tools, click                                // 292
    // the gear in the bottom right corner, and select "enable source maps".                               // 293
    //                                                                                                     // 294
    // Firefox 23+ supports source maps but doesn't support either header yet,                             // 295
    // so we include the '//#' comment for it:                                                             // 296
    //   https://bugzilla.mozilla.org/show_bug.cgi?id=765993                                               // 297
    // In FF 23 you need to turn on `devtools.debugger.source-maps-enabled`                                // 298
    // in `about:config` (it is on by default in FF 24).                                                   // 299
    if (info.sourceMapUrl)                                                                                 // 300
      res.setHeader('X-SourceMap', info.sourceMapUrl);                                                     // 301
                                                                                                           // 302
    send(req, path.join(clientDir, info.path))                                                             // 303
      .maxage(maxAge)                                                                                      // 304
      .hidden(true)  // if we specified a dotfile in the manifest, serve it                                // 305
      .on('error', function (err) {                                                                        // 306
        Log.error("Error serving static file " + err);                                                     // 307
        res.writeHead(500);                                                                                // 308
        res.end();                                                                                         // 309
      })                                                                                                   // 310
      .on('directory', function () {                                                                       // 311
        Log.error("Unexpected directory " + info.path);                                                    // 312
        res.writeHead(500);                                                                                // 313
        res.end();                                                                                         // 314
      })                                                                                                   // 315
      .pipe(res);                                                                                          // 316
  });                                                                                                      // 317
                                                                                                           // 318
  // Packages and apps can add handlers to this via WebApp.connectHandlers.                                // 319
  // They are inserted before our default handler.                                                         // 320
  var packageAndAppHandlers = connect();                                                                   // 321
  app.use(packageAndAppHandlers);                                                                          // 322
                                                                                                           // 323
  var suppressConnectErrors = false;                                                                       // 324
  // connect knows it is an error handler because it has 4 arguments instead of                            // 325
  // 3. go figure.  (It is not smart enough to find such a thing if it's hidden                            // 326
  // inside packageAndAppHandlers.)                                                                        // 327
  app.use(function (err, req, res, next) {                                                                 // 328
    if (!err || !suppressConnectErrors || !req.headers['x-suppress-error']) {                              // 329
      next(err);                                                                                           // 330
      return;                                                                                              // 331
    }                                                                                                      // 332
    res.writeHead(err.status, { 'Content-Type': 'text/plain' });                                           // 333
    res.end("An error message");                                                                           // 334
  });                                                                                                      // 335
                                                                                                           // 336
  // Will be updated by main before we listen.                                                             // 337
  var boilerplateHtml = null;                                                                              // 338
  app.use(function (req, res, next) {                                                                      // 339
    if (! appUrl(req.url))                                                                                 // 340
      return next();                                                                                       // 341
                                                                                                           // 342
    if (!boilerplateHtml)                                                                                  // 343
      throw new Error("boilerplateHtml should be set before listening!");                                  // 344
                                                                                                           // 345
    var request = WebApp.categorizeRequest(req);                                                           // 346
                                                                                                           // 347
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});                                      // 348
                                                                                                           // 349
    var requestSpecificHtml = htmlAttributes(boilerplateHtml, request);                                    // 350
    res.write(requestSpecificHtml);                                                                        // 351
    res.end();                                                                                             // 352
    return undefined;                                                                                      // 353
  });                                                                                                      // 354
                                                                                                           // 355
  // Return 404 by default, if no other handlers serve this URL.                                           // 356
  app.use(function (req, res) {                                                                            // 357
    res.writeHead(404);                                                                                    // 358
    res.end();                                                                                             // 359
  });                                                                                                      // 360
                                                                                                           // 361
                                                                                                           // 362
  var httpServer = http.createServer(app);                                                                 // 363
  var onListeningCallbacks = [];                                                                           // 364
                                                                                                           // 365
  // start up app                                                                                          // 366
  _.extend(WebApp, {                                                                                       // 367
    connectHandlers: packageAndAppHandlers,                                                                // 368
    httpServer: httpServer,                                                                                // 369
    // metadata about the client program that we serve                                                     // 370
    clientProgram: {                                                                                       // 371
      manifest: clientJson.manifest                                                                        // 372
      // XXX do we need a "root: clientDir" field here? it used to be here but                             // 373
      // was unused.                                                                                       // 374
    },                                                                                                     // 375
    // For testing.                                                                                        // 376
    suppressConnectErrors: function () {                                                                   // 377
      suppressConnectErrors = true;                                                                        // 378
    },                                                                                                     // 379
    onListening: function (f) {                                                                            // 380
      if (onListeningCallbacks)                                                                            // 381
        onListeningCallbacks.push(f);                                                                      // 382
      else                                                                                                 // 383
        f();                                                                                               // 384
    },                                                                                                     // 385
    // Hack: allow http tests to call connect.basicAuth without making them                                // 386
    // Npm.depends on another copy of connect. (That would be fine if we could                             // 387
    // have test-only NPM dependencies but is overkill here.)                                              // 388
    __basicAuth__: connect.basicAuth                                                                       // 389
  });                                                                                                      // 390
                                                                                                           // 391
  // Let the rest of the packages (and Meteor.startup hooks) insert connect                                // 392
  // middlewares and update __meteor_runtime_config__, then keep going to set up                           // 393
  // actually serving HTML.                                                                                // 394
  main = function (argv) {                                                                                 // 395
    // main happens post startup hooks, so we don't need a Meteor.startup() to                             // 396
    // ensure this happens after the galaxy package is loaded.                                             // 397
    var AppConfig = Package["application-configuration"].AppConfig;                                        // 398
    argv = optimist(argv).boolean('keepalive').argv;                                                       // 399
                                                                                                           // 400
    var boilerplateHtmlPath = path.join(clientDir, clientJson.page);                                       // 401
    boilerplateHtml = fs.readFileSync(boilerplateHtmlPath, 'utf8');                                        // 402
                                                                                                           // 403
    // Include __meteor_runtime_config__ in the app html, as an inline script if                           // 404
    // it's not forbidden by CSP.                                                                          // 405
    var browserPolicyPackage = Package["browser-policy-common"];                                           // 406
    if (! browserPolicyPackage ||                                                                          // 407
        ! browserPolicyPackage.BrowserPolicy.content ||                                                    // 408
        browserPolicyPackage.BrowserPolicy.content.inlineScriptsAllowed()) {                               // 409
      boilerplateHtml = boilerplateHtml.replace(                                                           // 410
          /##RUNTIME_CONFIG##/,                                                                            // 411
        "<script type='text/javascript'>__meteor_runtime_config__ = " +                                    // 412
          JSON.stringify(__meteor_runtime_config__) + ";</script>");                                       // 413
    } else {                                                                                               // 414
      boilerplateHtml = boilerplateHtml.replace(                                                           // 415
        /##RUNTIME_CONFIG##/,                                                                              // 416
        "<script type='text/javascript' src='##ROOT_URL_PATH_PREFIX##/meteor_runtime_config.js'></script>" // 417
      );                                                                                                   // 418
    }                                                                                                      // 419
    boilerplateHtml = boilerplateHtml.replace(                                                             // 420
        /##ROOT_URL_PATH_PREFIX##/g,                                                                       // 421
      __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || "");                                               // 422
                                                                                                           // 423
    // only start listening after all the startup code has run.                                            // 424
    var localPort = parseInt(process.env.PORT) || 0;                                                       // 425
    var host = process.env.BIND_IP;                                                                        // 426
    var localIp = host || '0.0.0.0';                                                                       // 427
    httpServer.listen(localPort, localIp, Meteor.bindEnvironment(function() {                              // 428
      if (argv.keepalive || true)                                                                          // 429
        console.log("LISTENING"); // must match run.js                                                     // 430
      var port = httpServer.address().port;                                                                // 431
      var proxyBinding;                                                                                    // 432
                                                                                                           // 433
      AppConfig.configurePackage('webapp', function (configuration) {                                      // 434
        if (proxyBinding)                                                                                  // 435
          proxyBinding.stop();                                                                             // 436
        if (configuration && configuration.proxy) {                                                        // 437
          proxyBinding = AppConfig.configureService(configuration.proxyServiceName || "proxy", function (proxyService) {
            if (proxyService.providers.proxy) {                                                            // 439
              var proxyConf;                                                                               // 440
              if (process.env.ADMIN_APP) {                                                                 // 441
                proxyConf = {                                                                              // 442
                  securePort: 44333,                                                                       // 443
                  insecurePort: 9414,                                                                      // 444
                  bindHost: "localhost",                                                                   // 445
                  bindPathPrefix: "/" + process.env.GALAXY_APP                                             // 446
                };                                                                                         // 447
              } else {                                                                                     // 448
                proxyConf = configuration.proxy;                                                           // 449
                                                                                                           // 450
              }                                                                                            // 451
              Log("Attempting to bind to proxy at " + proxyService.providers.proxy);                       // 452
              WebAppInternals.bindToProxy(_.extend({                                                       // 453
                proxyEndpoint: proxyService.providers.proxy                                                // 454
              }, proxyConf));                                                                              // 455
            }                                                                                              // 456
          });                                                                                              // 457
        }                                                                                                  // 458
      });                                                                                                  // 459
                                                                                                           // 460
      var callbacks = onListeningCallbacks;                                                                // 461
      onListeningCallbacks = null;                                                                         // 462
      _.each(callbacks, function (x) { x(); });                                                            // 463
                                                                                                           // 464
    }, function (e) {                                                                                      // 465
      console.error("Error listening:", e);                                                                // 466
      console.error(e.stack);                                                                              // 467
    }));                                                                                                   // 468
                                                                                                           // 469
    if (argv.keepalive)                                                                                    // 470
      initKeepalive();                                                                                     // 471
    return 'DAEMON';                                                                                       // 472
  };                                                                                                       // 473
};                                                                                                         // 474
                                                                                                           // 475
WebAppInternals.bindToProxy = function (proxyConfig) {                                                     // 476
  var securePort = proxyConfig.securePort || 4433;                                                         // 477
  var insecurePort = proxyConfig.insecurePort || 8080;                                                     // 478
  var bindPathPrefix = proxyConfig.bindPathPrefix || "";                                                   // 479
  // XXX also support galaxy-based lookup                                                                  // 480
  if (!proxyConfig.proxyEndpoint)                                                                          // 481
    throw new Error("missing proxyEndpoint");                                                              // 482
  if (!proxyConfig.bindHost)                                                                               // 483
    throw new Error("missing bindHost");                                                                   // 484
  if (!process.env.GALAXY_JOB)                                                                             // 485
    throw new Error("missing $GALAXY_JOB");                                                                // 486
  if (!process.env.GALAXY_APP)                                                                             // 487
    throw new Error("missing $GALAXY_APP");                                                                // 488
  if (!process.env.LAST_START)                                                                             // 489
    throw new Error("missing $LAST_START");                                                                // 490
                                                                                                           // 491
  // XXX rename pid argument to bindTo.                                                                    // 492
  var pid = {                                                                                              // 493
    job: process.env.GALAXY_JOB,                                                                           // 494
    lastStarted: process.env.LAST_START,                                                                   // 495
    app: process.env.GALAXY_APP                                                                            // 496
  };                                                                                                       // 497
  var myHost = os.hostname();                                                                              // 498
                                                                                                           // 499
  var ddpBindTo = {                                                                                        // 500
    ddpUrl: 'ddp://' + proxyConfig.bindHost + ':' + securePort + bindPathPrefix + '/',                     // 501
    insecurePort: insecurePort                                                                             // 502
  };                                                                                                       // 503
                                                                                                           // 504
  // This is run after packages are loaded (in main) so we can use                                         // 505
  // DDP.connect.                                                                                          // 506
  var proxy = DDP.connect(proxyConfig.proxyEndpoint);                                                      // 507
  var route = process.env.ROUTE;                                                                           // 508
  var host = route.split(":")[0];                                                                          // 509
  var port = +route.split(":")[1];                                                                         // 510
                                                                                                           // 511
  var completedBindings = {                                                                                // 512
    ddp: false,                                                                                            // 513
    http: false,                                                                                           // 514
    https: proxyConfig.securePort !== null ? false : undefined                                             // 515
  };                                                                                                       // 516
                                                                                                           // 517
  var bindingDoneCallback = function (binding) {                                                           // 518
    return function (err, resp) {                                                                          // 519
      if (err)                                                                                             // 520
        throw err;                                                                                         // 521
                                                                                                           // 522
      completedBindings[binding] = true;                                                                   // 523
      var completedAll = _.every(_.keys(completedBindings), function (binding) {                           // 524
        return (completedBindings[binding] ||                                                              // 525
          completedBindings[binding] === undefined);                                                       // 526
      });                                                                                                  // 527
      if (completedAll)                                                                                    // 528
        Log("Bound to proxy.");                                                                            // 529
      return completedAll;                                                                                 // 530
    };                                                                                                     // 531
  };                                                                                                       // 532
                                                                                                           // 533
  proxy.call('bindDdp', {                                                                                  // 534
    pid: pid,                                                                                              // 535
    bindTo: ddpBindTo,                                                                                     // 536
    proxyTo: {                                                                                             // 537
      host: host,                                                                                          // 538
      port: port,                                                                                          // 539
      pathPrefix: bindPathPrefix + '/websocket'                                                            // 540
    }                                                                                                      // 541
  }, bindingDoneCallback("ddp"));                                                                          // 542
  proxy.call('bindHttp', {                                                                                 // 543
    pid: pid,                                                                                              // 544
    bindTo: {                                                                                              // 545
      host: proxyConfig.bindHost,                                                                          // 546
      port: insecurePort,                                                                                  // 547
      pathPrefix: bindPathPrefix                                                                           // 548
    },                                                                                                     // 549
    proxyTo: {                                                                                             // 550
      host: host,                                                                                          // 551
      port: port,                                                                                          // 552
      pathPrefix: bindPathPrefix                                                                           // 553
    }                                                                                                      // 554
  }, bindingDoneCallback("http"));                                                                         // 555
  if (proxyConfig.securePort !== null) {                                                                   // 556
    proxy.call('bindHttp', {                                                                               // 557
      pid: pid,                                                                                            // 558
      bindTo: {                                                                                            // 559
        host: proxyConfig.bindHost,                                                                        // 560
        port: securePort,                                                                                  // 561
        pathPrefix: bindPathPrefix,                                                                        // 562
        ssl: true                                                                                          // 563
      },                                                                                                   // 564
      proxyTo: {                                                                                           // 565
        host: host,                                                                                        // 566
        port: port,                                                                                        // 567
        pathPrefix: bindPathPrefix                                                                         // 568
      }                                                                                                    // 569
    }, bindingDoneCallback("https"));                                                                      // 570
  }                                                                                                        // 571
};                                                                                                         // 572
                                                                                                           // 573
runWebAppServer();                                                                                         // 574
                                                                                                           // 575
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.webapp = {
  WebApp: WebApp,
  main: main,
  WebAppInternals: WebAppInternals
};

})();
