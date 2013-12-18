(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var _ = Package.underscore._;

/* Package-scope variables */
var Random;

(function () {

//////////////////////////////////////////////////////////////////////////////////////
//                                                                                  //
// packages/random/random.js                                                        //
//                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////
                                                                                    //
// We use cryptographically strong PRNGs (crypto.getRandomBytes() on the server,    // 1
// window.crypto.getRandomValues() in the browser) when available. If these         // 2
// PRNGs fail, we fall back to the Alea PRNG, which is not cryptographically        // 3
// strong, and we seed it with various sources such as the date, Math.random,       // 4
// and window size on the client.  When using crypto.getRandomValues(), our         // 5
// primitive is hexString(), from which we construct fraction(). When using         // 6
// window.crypto.getRandomValues() or alea, the primitive is fraction and we use    // 7
// that to construct hex string.                                                    // 8
                                                                                    // 9
if (Meteor.isServer)                                                                // 10
  var nodeCrypto = Npm.require('crypto');                                           // 11
                                                                                    // 12
// see http://baagoe.org/en/wiki/Better_random_numbers_for_javascript               // 13
// for a full discussion and Alea implementation.                                   // 14
var Alea = function () {                                                            // 15
  function Mash() {                                                                 // 16
    var n = 0xefc8249d;                                                             // 17
                                                                                    // 18
    var mash = function(data) {                                                     // 19
      data = data.toString();                                                       // 20
      for (var i = 0; i < data.length; i++) {                                       // 21
        n += data.charCodeAt(i);                                                    // 22
        var h = 0.02519603282416938 * n;                                            // 23
        n = h >>> 0;                                                                // 24
        h -= n;                                                                     // 25
        h *= n;                                                                     // 26
        n = h >>> 0;                                                                // 27
        h -= n;                                                                     // 28
        n += h * 0x100000000; // 2^32                                               // 29
      }                                                                             // 30
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32                           // 31
    };                                                                              // 32
                                                                                    // 33
    mash.version = 'Mash 0.9';                                                      // 34
    return mash;                                                                    // 35
  }                                                                                 // 36
                                                                                    // 37
  return (function (args) {                                                         // 38
    var s0 = 0;                                                                     // 39
    var s1 = 0;                                                                     // 40
    var s2 = 0;                                                                     // 41
    var c = 1;                                                                      // 42
                                                                                    // 43
    if (args.length == 0) {                                                         // 44
      args = [+new Date];                                                           // 45
    }                                                                               // 46
    var mash = Mash();                                                              // 47
    s0 = mash(' ');                                                                 // 48
    s1 = mash(' ');                                                                 // 49
    s2 = mash(' ');                                                                 // 50
                                                                                    // 51
    for (var i = 0; i < args.length; i++) {                                         // 52
      s0 -= mash(args[i]);                                                          // 53
      if (s0 < 0) {                                                                 // 54
        s0 += 1;                                                                    // 55
      }                                                                             // 56
      s1 -= mash(args[i]);                                                          // 57
      if (s1 < 0) {                                                                 // 58
        s1 += 1;                                                                    // 59
      }                                                                             // 60
      s2 -= mash(args[i]);                                                          // 61
      if (s2 < 0) {                                                                 // 62
        s2 += 1;                                                                    // 63
      }                                                                             // 64
    }                                                                               // 65
    mash = null;                                                                    // 66
                                                                                    // 67
    var random = function() {                                                       // 68
      var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32                   // 69
      s0 = s1;                                                                      // 70
      s1 = s2;                                                                      // 71
      return s2 = t - (c = t | 0);                                                  // 72
    };                                                                              // 73
    random.uint32 = function() {                                                    // 74
      return random() * 0x100000000; // 2^32                                        // 75
    };                                                                              // 76
    random.fract53 = function() {                                                   // 77
      return random() +                                                             // 78
        (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53                // 79
    };                                                                              // 80
    random.version = 'Alea 0.9';                                                    // 81
    random.args = args;                                                             // 82
    return random;                                                                  // 83
                                                                                    // 84
  } (Array.prototype.slice.call(arguments)));                                       // 85
};                                                                                  // 86
                                                                                    // 87
var UNMISTAKABLE_CHARS = "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz"; // 88
                                                                                    // 89
// If seeds are provided, then the alea PRNG will be used, since cryptographic      // 90
// PRNGs (Node crypto and window.crypto.getRandomValues) don't allow us to          // 91
// specify seeds. The caller is responsible for making sure to provide a seed       // 92
// for alea if a csprng is not available.                                           // 93
var RandomGenerator = function (seedArray) {                                        // 94
  var self = this;                                                                  // 95
  if (seedArray !== undefined)                                                      // 96
    self.alea = Alea.apply(null, seedArray);                                        // 97
  self._Alea = Alea;                                                                // 98
};                                                                                  // 99
                                                                                    // 100
RandomGenerator.prototype.fraction = function () {                                  // 101
  var self = this;                                                                  // 102
  if (self.alea) {                                                                  // 103
    return self.alea();                                                             // 104
  } else if (nodeCrypto) {                                                          // 105
    var numerator = parseInt(self.hexString(8), 16);                                // 106
    return numerator * 2.3283064365386963e-10; // 2^-32                             // 107
  } else if (typeof window !== "undefined" && window.crypto &&                      // 108
             window.crypto.getRandomValues) {                                       // 109
    var array = new Uint32Array(1);                                                 // 110
    window.crypto.getRandomValues(array);                                           // 111
    return array[0] * 2.3283064365386963e-10; // 2^-32                              // 112
  }                                                                                 // 113
};                                                                                  // 114
                                                                                    // 115
RandomGenerator.prototype.hexString = function (digits) {                           // 116
  var self = this;                                                                  // 117
  if (nodeCrypto && ! self.alea) {                                                  // 118
    var numBytes = Math.ceil(digits / 2);                                           // 119
    var bytes;                                                                      // 120
    // Try to get cryptographically strong randomness. Fall back to                 // 121
    // non-cryptographically strong if not available.                               // 122
    try {                                                                           // 123
      bytes = nodeCrypto.randomBytes(numBytes);                                     // 124
    } catch (e) {                                                                   // 125
      // XXX should re-throw any error except insufficient entropy                  // 126
      bytes = nodeCrypto.pseudoRandomBytes(numBytes);                               // 127
    }                                                                               // 128
    var result = bytes.toString("hex");                                             // 129
    // If the number of digits is odd, we'll have generated an extra 4 bits         // 130
    // of randomness, so we need to trim the last digit.                            // 131
    return result.substring(0, digits);                                             // 132
  } else {                                                                          // 133
    var hexDigits = [];                                                             // 134
    for (var i = 0; i < digits; ++i) {                                              // 135
      hexDigits.push(self.choice("0123456789abcdef"));                              // 136
    }                                                                               // 137
    return hexDigits.join('');                                                      // 138
  }                                                                                 // 139
};                                                                                  // 140
                                                                                    // 141
RandomGenerator.prototype.id = function () {                                        // 142
  var digits = [];                                                                  // 143
  var self = this;                                                                  // 144
  // Length of 17 preserves around 96 bits of entropy, which is the                 // 145
  // amount of state in the Alea PRNG.                                              // 146
  for (var i = 0; i < 17; i++) {                                                    // 147
    digits[i] = self.choice(UNMISTAKABLE_CHARS);                                    // 148
  }                                                                                 // 149
  return digits.join("");                                                           // 150
};                                                                                  // 151
                                                                                    // 152
RandomGenerator.prototype.choice = function (arrayOrString) {                       // 153
  var index = Math.floor(this.fraction() * arrayOrString.length);                   // 154
  if (typeof arrayOrString === "string")                                            // 155
    return arrayOrString.substr(index, 1);                                          // 156
  else                                                                              // 157
    return arrayOrString[index];                                                    // 158
};                                                                                  // 159
                                                                                    // 160
// instantiate RNG.  Heuristically collect entropy from various sources when a      // 161
// cryptographic PRNG isn't available.                                              // 162
                                                                                    // 163
// client sources                                                                   // 164
var height = (typeof window !== 'undefined' && window.innerHeight) ||               // 165
      (typeof document !== 'undefined'                                              // 166
       && document.documentElement                                                  // 167
       && document.documentElement.clientHeight) ||                                 // 168
      (typeof document !== 'undefined'                                              // 169
       && document.body                                                             // 170
       && document.body.clientHeight) ||                                            // 171
      1;                                                                            // 172
                                                                                    // 173
var width = (typeof window !== 'undefined' && window.innerWidth) ||                 // 174
      (typeof document !== 'undefined'                                              // 175
       && document.documentElement                                                  // 176
       && document.documentElement.clientWidth) ||                                  // 177
      (typeof document !== 'undefined'                                              // 178
       && document.body                                                             // 179
       && document.body.clientWidth) ||                                             // 180
      1;                                                                            // 181
                                                                                    // 182
var agent = (typeof navigator !== 'undefined' && navigator.userAgent) || "";        // 183
                                                                                    // 184
if (nodeCrypto ||                                                                   // 185
    (typeof window !== "undefined" &&                                               // 186
     window.crypto && window.crypto.getRandomValues))                               // 187
  Random = new RandomGenerator();                                                   // 188
else                                                                                // 189
  Random = new RandomGenerator([new Date(), height, width, agent, Math.random()]);  // 190
                                                                                    // 191
Random.create = function () {                                                       // 192
  return new RandomGenerator(arguments);                                            // 193
};                                                                                  // 194
                                                                                    // 195
//////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////
//                                                                                  //
// packages/random/deprecated.js                                                    //
//                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////
                                                                                    //
// Before this package existed, we used to use this Meteor.uuid()                   // 1
// implementing the RFC 4122 v4 UUID. It is no longer documented                    // 2
// and will go away.                                                                // 3
// XXX COMPAT WITH 0.5.6                                                            // 4
Meteor.uuid = function () {                                                         // 5
  var HEX_DIGITS = "0123456789abcdef";                                              // 6
  var s = [];                                                                       // 7
  for (var i = 0; i < 36; i++) {                                                    // 8
    s[i] = Random.choice(HEX_DIGITS);                                               // 9
  }                                                                                 // 10
  s[14] = "4";                                                                      // 11
  s[19] = HEX_DIGITS.substr((parseInt(s[19],16) & 0x3) | 0x8, 1);                   // 12
  s[8] = s[13] = s[18] = s[23] = "-";                                               // 13
                                                                                    // 14
  var uuid = s.join("");                                                            // 15
  return uuid;                                                                      // 16
};                                                                                  // 17
                                                                                    // 18
//////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.random = {
  Random: Random
};

})();
