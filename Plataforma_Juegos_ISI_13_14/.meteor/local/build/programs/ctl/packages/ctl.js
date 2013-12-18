(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var _ = Package.underscore._;
var DDP = Package.livedata.DDP;
var DDPServer = Package.livedata.DDPServer;
var MongoInternals = Package['mongo-livedata'].MongoInternals;
var Ctl = Package['ctl-helper'].Ctl;

/* Package-scope variables */
var main;

(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/ctl/ctl.js                                                                                       //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
Ctl.Commands.push({                                                                                          // 1
  name: "help",                                                                                              // 2
  func: function (argv) {                                                                                    // 3
    if (!argv._.length || argv.help)                                                                         // 4
      Ctl.usage();                                                                                           // 5
    var cmd = argv._.splice(0,1)[0];                                                                         // 6
    argv.help = true;                                                                                        // 7
                                                                                                             // 8
    Ctl.findCommand(cmd).func(argv);                                                                         // 9
  }                                                                                                          // 10
});                                                                                                          // 11
                                                                                                             // 12
var mergeObjects = function (obj1, obj2) {                                                                   // 13
  var result = _.clone(obj1);                                                                                // 14
  _.each(obj2, function (v, k) {                                                                             // 15
    // If both objects have an object at this key, then merge those objects.                                 // 16
    // Otherwise, choose obj2's value.                                                                       // 17
    if ((v instanceof Object) && (obj1[k] instanceof Object))                                                // 18
      result[k] = mergeObjects(v, obj1[k]);                                                                  // 19
    else                                                                                                     // 20
      result[k] = v;                                                                                         // 21
  });                                                                                                        // 22
  return result;                                                                                             // 23
};                                                                                                           // 24
                                                                                                             // 25
                                                                                                             // 26
Ctl.Commands.push({                                                                                          // 27
  name: "start",                                                                                             // 28
  help: "Start this app",                                                                                    // 29
  func: function (argv) {                                                                                    // 30
    if (argv.help || argv._.length !== 0) {                                                                  // 31
      process.stderr.write(                                                                                  // 32
"Usage: ctl start\n" +                                                                                       // 33
 "\n" +                                                                                                      // 34
"Starts the app. For now, this just means that it runs the 'server'\n" +                                     // 35
"program.\n"                                                                                                 // 36
);                                                                                                           // 37
      process.exit(1);                                                                                       // 38
    }                                                                                                        // 39
                                                                                                             // 40
    var numServers = Ctl.getJobsByApp(                                                                       // 41
      Ctl.myAppName(), {program: 'server', done: false}).count();                                            // 42
    if (numServers === 0) {                                                                                  // 43
      var appConfig = Ctl.prettyCall(                                                                        // 44
        Ctl.findGalaxy(), 'getAppConfiguration', [Ctl.myAppName()]);                                         // 45
                                                                                                             // 46
      var proxyConfig;                                                                                       // 47
      var bindPathPrefix = "";                                                                               // 48
      if (appConfig.admin) {                                                                                 // 49
        bindPathPrefix = "/" + Ctl.myAppName();                                                              // 50
      }                                                                                                      // 51
                                                                                                             // 52
                                                                                                             // 53
      // XXX args? env?                                                                                      // 54
      Ctl.prettyCall(Ctl.findGalaxy(), 'run', [Ctl.myAppName(), 'server', {                                  // 55
        exitPolicy: 'restart',                                                                               // 56
        env: {                                                                                               // 57
          ROOT_URL: "https://" + appConfig.sitename + bindPathPrefix,                                        // 58
          METEOR_SETTINGS: appConfig.METEOR_SETTINGS,                                                        // 59
          ADMIN_APP: appConfig.admin //TODO: When apps have admin & non-admin sides, set this based on that. // 60
        },                                                                                                   // 61
        ports: {                                                                                             // 62
          "main": {                                                                                          // 63
            bindEnv: "PORT",                                                                                 // 64
            routeEnv: "ROUTE"//,                                                                             // 65
            //bindIpEnv: "BIND_IP" // Later, we can teach Satellite to do                                    // 66
            //something like recommend the process bind to a particular IP here.                             // 67
            //For now, we don't have a way of setting this, so Satellite binds                               // 68
            //to 0.0.0.0                                                                                     // 69
          }                                                                                                  // 70
        },                                                                                                   // 71
        tags: ["runner"]                                                                                     // 72
      }]);                                                                                                   // 73
      console.log("Started a server.");                                                                      // 74
    } else {                                                                                                 // 75
      console.log("Server already running.");                                                                // 76
    }                                                                                                        // 77
  }                                                                                                          // 78
});                                                                                                          // 79
                                                                                                             // 80
Ctl.Commands.push({                                                                                          // 81
  name: "stop",                                                                                              // 82
  help: "Stop this app",                                                                                     // 83
  func: function (argv) {                                                                                    // 84
    if (argv.help || argv._.length !== 0) {                                                                  // 85
      process.stderr.write(                                                                                  // 86
"Usage: ctl stop\n" +                                                                                        // 87
 "\n" +                                                                                                      // 88
"Stops the app. For now, this just means that it kills all jobs\n" +                                         // 89
"other than itself.\n"                                                                                       // 90
);                                                                                                           // 91
      process.exit(1);                                                                                       // 92
    }                                                                                                        // 93
                                                                                                             // 94
    // Get all jobs (other than this job: don't commit suicide!) that are not                                // 95
    // already killed.                                                                                       // 96
    var jobs = Ctl.getJobsByApp(                                                                             // 97
      Ctl.myAppName(), {_id: {$ne: Ctl.myJobId()}, done: false});                                            // 98
    jobs.forEach(function (job) {                                                                            // 99
      // Don't commit suicide.                                                                               // 100
      if (job._id === Ctl.myJobId())                                                                         // 101
        return;                                                                                              // 102
      // It's dead, Jim.                                                                                     // 103
      if (job.done)                                                                                          // 104
        return;                                                                                              // 105
      Ctl.kill(job.program, job._id);                                                                        // 106
    });                                                                                                      // 107
    console.log("Server stopped.");                                                                          // 108
  }                                                                                                          // 109
});                                                                                                          // 110
                                                                                                             // 111
                                                                                                             // 112
Ctl.Commands.push({                                                                                          // 113
  name: "scale",                                                                                             // 114
  help: "Scale jobs",                                                                                        // 115
  func: function (argv) {                                                                                    // 116
    if (argv.help || argv._.length === 0 || _.contains(argv._, 'ctl')) {                                     // 117
      process.stderr.write(                                                                                  // 118
"Usage: ctl scale program1=n [...] \n" +                                                                     // 119
 "\n" +                                                                                                      // 120
"Scales some programs. Runs or kills jobs until there are n non-done jobs\n" +                               // 121
"in that state.\n"                                                                                           // 122
);                                                                                                           // 123
      process.exit(1);                                                                                       // 124
    }                                                                                                        // 125
                                                                                                             // 126
    var scales = _.map(argv._, function (arg) {                                                              // 127
      var m = arg.match(/^(.+)=(\d+)$/);                                                                     // 128
      if (!m) {                                                                                              // 129
        console.log("Bad scaling argument; should be program=number.");                                      // 130
        process.exit(1);                                                                                     // 131
      }                                                                                                      // 132
      return {program: m[1], scale: parseInt(m[2])};                                                         // 133
    });                                                                                                      // 134
                                                                                                             // 135
    _.each(scales, function (s) {                                                                            // 136
      var jobs = Ctl.getJobsByApp(                                                                           // 137
        Ctl.myAppName(), {program: s.program, done: false});                                                 // 138
      jobs.forEach(function (job) {                                                                          // 139
        --s.scale;                                                                                           // 140
        // Is this an extraneous job, more than the number that we need? Kill                                // 141
        // it!                                                                                               // 142
        if (s.scale < 0) {                                                                                   // 143
          Ctl.kill(s.program, job._id);                                                                      // 144
        }                                                                                                    // 145
      });                                                                                                    // 146
      // Now start any jobs that are necessary.                                                              // 147
      if (s.scale <= 0)                                                                                      // 148
        return;                                                                                              // 149
      console.log("Starting %d jobs for %s", s.scale, s.program);                                            // 150
      _.times(s.scale, function () {                                                                         // 151
        // XXX args? env?                                                                                    // 152
        Ctl.prettyCall(Ctl.findGalaxy(), 'run', [Ctl.myAppName(), s.program, {                               // 153
          exitPolicy: 'restart'                                                                              // 154
        }]);                                                                                                 // 155
      });                                                                                                    // 156
    });                                                                                                      // 157
  }                                                                                                          // 158
});                                                                                                          // 159
                                                                                                             // 160
main = function (argv) {                                                                                     // 161
  return Ctl.main(argv);                                                                                     // 162
};                                                                                                           // 163
                                                                                                             // 164
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.ctl = {
  main: main
};

})();
