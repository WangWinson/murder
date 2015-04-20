// # Model
// [lib/index.js](../index.html) > lib/types/Model.js
'use strict';

var CRDT = require('../core/ConflictFreeReplicatedDataType.js'),
    debug = require('../debug.js');

var Model = CRDT.extend('Model');

module.exports = Model;

Model.prototype.init = function (config) {
  // TODO: schema
  if (config.schema) { this.schema = config.schema; }
};

Model.defineOperation('change', function (params) {
  debug.log(this.type + '..change-method');
  if (params) { this.mergeState(params); }
  this.compress();
});
