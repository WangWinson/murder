// # Crow CRDT
// [lib/index.js](index.html) > example/Crow.js
'use strict';

var CRDT = require('../lib/core/ConflictFreeReplicatedDataType.js'),
    debug = require('../lib/debug.js');

var Crow = CRDT.extend('Crow');

module.exports = Crow;

// Assign the author and sources to the prototype.
Crow.prototype.author = require('./author.js')(false);
Crow.prototype.sources = require('./sources.js');
Crow.prototype.relays = require('./relays.js');

// Crow fly operation.
Crow.defineOperation('fly', function (params, operation) {
  debug.log(this.type + '..fly', params);
  params = params || {};
  // Zero is avoided by calling random again.
  params.x = params.x || Math.random() || Math.random();
  params.y = params.y || Math.random() || Math.random();
  operation.params = params;
  this.state = this.state || {};
  this.state.x = params.x;
  this.state.y = params.y;
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
