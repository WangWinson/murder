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

  // Then construct a crow for this client instance.
  var crow = new Crow(author);

  // Initialize the crow.
  crow.sync().then(function () {
    // Have the new crow join our murder of crows.
    crow.fly();
    murder.add(crow.id);

    // Every 10 seconds have the crow fly.
    setInterval(crow.fly.bind(crow), 10000);
  });
});

// ## ISC LICENSE

// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that there is no copyright notice
// and this permission notice appear in all copies.

// **THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
// OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
// OF THIS SOFTWARE.**
