// # Model
// [lib/index.js](../index.html) > lib/types/Model.js
'use strict';

var CRDT = require('../core/ConflictFreeReplicatedDataType.js'),
    debug = require('../debug.js');

var Model = CRDT.extend('Model');

module.exports = Model;

Model.defineOperation('change', function (params, operation) {
  debug.log(this.type + '..change-method');
  var promise;
  if (this.isInvalidOperation(operation)) {
    promise = this.resolveState();
  }
  this.version = operation.version;
  // this.state = params || this.state;
  var stateChange = new this.StateChange();
  stateChange.diff(this.state, params.state);
  stateChange.apply(this.state);
  debug.log('FINISH');
  return promise;
});

// TODO: I dunno if deep-diff is essential for this.
//       A simple mixin function might do the trick.
var diff = require('deep-diff');

Model.prototype.StateChange = StateChange;

function StateChange() {
  return this;
}

StateChange.prototype.diff = function (target, source) {
  this.changes = diff(target, source);
  return this;
};

StateChange.prototype.apply = function (target) {
  this.changes.forEach(function (change) {
    diff.applyChange(target, true, change);
  });
  return this;
};


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
