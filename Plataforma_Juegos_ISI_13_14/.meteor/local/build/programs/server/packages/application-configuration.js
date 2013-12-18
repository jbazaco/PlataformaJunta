(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var _ = Package.underscore._;
var DDP = Package.livedata.DDP;
var DDPServer = Package.livedata.DDPServer;
var EJSON = Package.ejson.EJSON;

/* Package-scope variables */
var AppConfig;

(function () {

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/application-configuration/config.js                                              //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
var Future = Npm.require("fibers/future");                                                   // 1
                                                                                             // 2
AppConfig = {};                                                                              // 3
                                                                                             // 4
                                                                                             // 5
AppConfig.findGalaxy = _.once(function () {                                                  // 6
  if (!('GALAXY' in process.env || 'ULTRAWORLD_DDP_ENDPOINT' in process.env)) {              // 7
    return null;                                                                             // 8
  }                                                                                          // 9
                                                                                             // 10
  return DDP.connect(process.env.ULTRAWORLD_DDP_ENDPOINT || process.env.GALAXY);             // 11
});                                                                                          // 12
                                                                                             // 13
                                                                                             // 14
// TODO: Eventually, keep track of the replica set, and generally be conected to the         // 15
// leader.  Waiting on actually having that concept implemented in ultraworld.               // 16
var ultra = AppConfig.findGalaxy();                                                          // 17
                                                                                             // 18
var subFuture = new Future();                                                                // 19
if (ultra)                                                                                   // 20
  ultra.subscribe("oneApp", process.env.GALAXY_APP, subFuture.resolver());                   // 21
                                                                                             // 22
var OneAppApps;                                                                              // 23
var Services;                                                                                // 24
var collectionFuture = new Future();                                                         // 25
                                                                                             // 26
Meteor.startup(function () {                                                                 // 27
  if (ultra) {                                                                               // 28
    OneAppApps = new Meteor.Collection("apps", {                                             // 29
      connection: ultra                                                                      // 30
    });                                                                                      // 31
    Services = new Meteor.Collection('services', {                                           // 32
      connection: ultra                                                                      // 33
    });                                                                                      // 34
    // allow us to block on the collections being ready                                      // 35
    collectionFuture.return();                                                               // 36
  }                                                                                          // 37
});                                                                                          // 38
                                                                                             // 39
                                                                                             // 40
var staticAppConfig;                                                                         // 41
                                                                                             // 42
try {                                                                                        // 43
  if (process.env.APP_CONFIG) {                                                              // 44
    staticAppConfig = JSON.parse(process.env.APP_CONFIG);                                    // 45
  } else {                                                                                   // 46
    var settings;                                                                            // 47
    try {                                                                                    // 48
      if (process.env.METEOR_SETTINGS) {                                                     // 49
        settings = JSON.parse(process.env.METEOR_SETTINGS);                                  // 50
      }                                                                                      // 51
    } catch (e) {                                                                            // 52
      Log.warn("Could not parse METEOR_SETTINGS as JSON");                                   // 53
    }                                                                                        // 54
    staticAppConfig = {                                                                      // 55
      settings: settings,                                                                    // 56
      packages: {                                                                            // 57
        'mongo-livedata': {                                                                  // 58
          url: process.env.MONGO_URL                                                         // 59
        },                                                                                   // 60
        'email': {                                                                           // 61
          url: process.env.MAIL_URL                                                          // 62
        }                                                                                    // 63
      }                                                                                      // 64
    };                                                                                       // 65
  }                                                                                          // 66
} catch (e) {                                                                                // 67
  Log.warn("Could not parse initial APP_CONFIG environment variable");                       // 68
};                                                                                           // 69
                                                                                             // 70
AppConfig.getAppConfig = function () {                                                       // 71
  if (!subFuture.isResolved() && staticAppConfig) {                                          // 72
    return staticAppConfig;                                                                  // 73
  }                                                                                          // 74
  subFuture.wait();                                                                          // 75
  var myApp = OneAppApps.findOne();                                                          // 76
  if (myApp)                                                                                 // 77
    return myApp.config;                                                                     // 78
  throw new Error("there is no app config for this app");                                    // 79
};                                                                                           // 80
                                                                                             // 81
AppConfig.configurePackage = function (packageName, configure) {                             // 82
  var appConfig = AppConfig.getAppConfig(); // Will either be based in the env var,          // 83
                                         // or wait for galaxy to connect.                   // 84
  var lastConfig = appConfig && appConfig.packages && appConfig.packages[packageName];       // 85
  if (lastConfig) {                                                                          // 86
    configure(lastConfig);                                                                   // 87
  }                                                                                          // 88
  var configureIfDifferent = function (app) {                                                // 89
    if (!EJSON.equals(app.config && app.config.packages && app.config.packages[packageName], // 90
                      lastConfig)) {                                                         // 91
      lastConfig = app.config.packages[packageName];                                         // 92
      configure(lastConfig);                                                                 // 93
    }                                                                                        // 94
  };                                                                                         // 95
  var subHandle;                                                                             // 96
  var observed = new Future();                                                               // 97
                                                                                             // 98
  // This is not required to finish, so defer it so it doesn't block anything                // 99
  // else.                                                                                   // 100
  Meteor.defer( function () {                                                                // 101
    // there's a Meteor.startup() that produces the various collections, make                // 102
    // sure it runs first before we continue.                                                // 103
    collectionFuture.wait();                                                                 // 104
    subHandle = OneAppApps.find().observe({                                                  // 105
      added: configureIfDifferent,                                                           // 106
      changed: configureIfDifferent                                                          // 107
    });                                                                                      // 108
    observed.return();                                                                       // 109
  });                                                                                        // 110
                                                                                             // 111
  return {                                                                                   // 112
    stop: function () {                                                                      // 113
      observed.wait();                                                                       // 114
      subHandle.stop();                                                                      // 115
    }                                                                                        // 116
  };                                                                                         // 117
};                                                                                           // 118
                                                                                             // 119
                                                                                             // 120
AppConfig.configureService = function (serviceName, configure) {                             // 121
  if (ultra) {                                                                               // 122
    // there's a Meteor.startup() that produces the various collections, make                // 123
    // sure it runs first before we continue.                                                // 124
    collectionFuture.wait();                                                                 // 125
    ultra.subscribe('servicesByName', serviceName);                                          // 126
    return Services.find({name: serviceName}).observe({                                      // 127
      added: configure,                                                                      // 128
      changed: configure                                                                     // 129
    });                                                                                      // 130
  }                                                                                          // 131
                                                                                             // 132
};                                                                                           // 133
                                                                                             // 134
///////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['application-configuration'] = {
  AppConfig: AppConfig
};

})();
