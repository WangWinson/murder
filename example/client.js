// # Client-side Example
// [lib/index.js](index.html) > example/client.js
'use strict';

// Generate a uuid for this client.
var author = require('./lib/author.js')(false),
    debug = require('../lib/debug.js');

global.CRDTReactMixin = require('../lib/extras/ReactMixin.js');

debug.enable('murder:*');
// debug.enable('murder:info');

require('./lib/sources.js');

// Import data model classes.
var Crow = require('./model/Crow.js'),
    Murder = require('./model/Murder.js');

// Construct a murder of crows with the id of this client and the list of sources.
var murder = new Murder('of_crows');

exports.crows = murder;
global.crows = murder;

// Initialize the muder.
murder.sync().then(function () {
  console.log('murder synced', murder);

  function flock() {
    var count = 0;
    murder.toArray().forEach(function (fellow) {
      if (count > 5) { return; }
      if (fellow !== crow) {
        setTimeout(fellow.fly.bind(fellow), 100 * count);
      }
      count += 1;
    });
    setTimeout(flock,  Math.max(20000, Math.random() * 60000));
  }

  // Then construct a crow for this client instance.
  var crow = new Crow(author);

  // Initialize the crow.
  crow.sync().then(function () {
    murder.add(crow.id);

    ping();
    setTimeout(flock, Math.max(30000, Math.random() * 60000));

    // Every 10 seconds have the crow fly.
    function ping() {
      crow.fly();
      setInterval(ping, Math.max(10000, Math.random() * 30000));
    }
  });
});
