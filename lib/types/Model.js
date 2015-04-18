// # Model
// [lib/index.js](../index.html) > lib/types/Model.js
'use strict';

var CRDT = require('../core/ConflictFreeReplicatedDataType.js'),
    debug = require('../debug.js');

var Model = CRDT.extend('Model');

module.exports = Model;

Model.prototype.init = function (config) {
  if (config.schema) { this.schema = config.schema; }
};

Model.defineOperation('change', function (params, operation) {
  debug.log(this.type + '..change-method');
  var promise;
  if (this.isInvalidOperation(operation)) {
    promise = this.resolveState();
  }
  this.version = operation.version;
  // TODO:
  // this.state = params || this.state;
  // var stateChange = new this.StateChange();
  // stateChange.diff(this.state, params.state);
  // stateChange.apply(this.state);
  // debug.log('FINISH');
  return promise;
});

// TODO: I dunno if deep-diff is essential for this.
//       A simple mixin function might do the trick.
// var diff = require('deep-diff');

// Model.prototype.StateChange = StateChange;
//
// function StateChange() {
//   return this;
// }
//
// StateChange.prototype.diff = function (target, source) {
//   this.changes = diff(target, source);
//   return this;
// };
//
// StateChange.prototype.apply = function (target) {
//   this.changes.forEach(function (change) {
//     diff.applyChange(target, true, change);
//   });
//   return this;
// };
