// # Crow CRDT
// [lib/index.js](index.html) > example/Crow.js
'use strict';

var common = require('../lib/common.js'),
    CRDT = require('../../lib/core/ConflictFreeReplicatedDataType.js'),
    debug = require('../../lib/debug.js');

var Crow = CRDT.extend('Crow');

module.exports = Crow;

// Assign the author and sources to the prototype.
common.configureCRDT(Crow, {isServer: false});

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
