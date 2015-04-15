// # Source
// [lib/index.js](../index.html) > lib/core/Source.js

// This class has overloaded responability. This was done in order to reduce the
// complexity of the core system.
//
// A source can be used to implement a local storage mechanism for CRDT data.
// It can also be used to add support for various message protocols.
//
// Generally, sources do one of the two, but a source could be adapted to do both at once.
'use strict';
/*global Promise*/

// var events = require('events');

var common = require('../common.js'),
    debug = require('../debug.js');//,
    // Operation = require('./Operation.js');//,
    // Relay = require('./Relay.js');

// Source and CRDT require each other as dependencies.
var CRDT = require('./ConflictFreeReplicatedDataType.js');
CRDT = CRDT.CRDT || CRDT;

module.exports = Source;

// ### Constructor

// * `options` --
function Source(options) {
  // this.isOpen = false;
  this.options = options || {};
  // this.relays = [];
  this.type = this.constructor.type;
  debug.log(this.type + '..init:', '', '\n', this.options);
  this.init();
  return this;
}

// All sources must have a type.
Source.type = 'LocalSource';

// **Source.adapt(type)** --
Source.adapt = common.adaptClass(Source);

// **Source.define(name, func)** --
Source.define = common.defineMethod;

// ### Prototype

// Source.prototype.Operation = Operation;
// Source.prototype.Relay = Relay;

// **Source:init()** --
Source.prototype.init = function () {};

// **Source:emptyPromise(value)** --
Source.prototype.emptyPromise = common.emptyPromise;

// **Source:open()** --
Source.prototype.open = function (override) {
  debug.log(this.type + '..open');
  // if (this.isOpen) { return this.emptyPromise(this); }
  // this.isOpen = true;
  // this.remote = this.remote || new events.EventEmitter();
  // this.remote.emit('open');
  return override || this.emptyPromise(this);
};

// **Source:close()** --
Source.prototype.close = function (override) {
  debug.log(this.type + '..close');
  // if (!this.isOpen) { return this.emptyPromise(this); }
  // this.isOpen = false;
  // this.remote.emit('close', this);
  // delete this.remote;
  return override || this.emptyPromise(this);
};

// **Source:free()** --
Source.prototype.free = function () {
  debug.log(this.type + '..free');
  // this.relays.forEach(function (relay) { relay.disconnect(); });
  // this.relays = [];
  return this.clear();
};

// **Source:clear()** --
Source.prototype.clear = function (override) {
  debug.log(this.type + '..clear');
  return override || this.emptyPromise(this);
};

// **Source:load()** --
Source.prototype.load = function (override) {
  debug.log(this.type + '..load');
  return override || this.emptyPromise(this);
};

// // **Source:relay(stream)** --
// Source.prototype.relay = function (stream, _otherSources) {
//   debug.log(this.type + '..relay');
//   var relay = new this.Relay(this, stream, _otherSources);
//   this.relays.push(relay);
//   relay.connect();
//   return relay;
// };
//
// // **Source:forgetRelay(relay)** --
// Source.prototype.forgetRelay = function (relay) {
//   debug.log(this.type + '..forgetRelay');
//   var index = this.relays.indexOf(relay);
//   if (index !== -1) { this.relays.splice(index, 1); }
// };

// // **Source:cleanOperation(operation)** --
// Source.prototype.cleanOperation = function (operation) {
//   debug.log(this.type + '..cleanOperation');
//   if (typeof operation === 'string') {
//     try { return this.Operation.parse(operation); }
//     catch (err) {}
//   }
//   if (!(operation instanceof this.Operation)) {
//     return this.Operation.fromJSON(operation);
//   }
//   return operation;
// };

// **Source:get(operation)** --
Source.prototype.get = common.getCRDT;
// Source.prototype.get = function (operation) {
//   var Type = CRDT.getType(operation.type);
//   return Type.get(operation.id);
// };

// // **Source:otherSources(crdt)** --
// Source.prototype.otherSources = function (crdt) {
//   return crdt.otherSources(this);
// };

// // **Source:broadcast(operation)** --
// Source.prototype.broadcast = function (operation, override) {
//   debug.log(this.type + '..broadcast:', '', '\n', operation.toString());
//   var crdt = this.get(operation),
//       promises = [];
//   if (crdt) {
//     promises.push(crdt.invoke(operation));
//     if (!operation.noOtherSources) {
//       operation.noOtherSources = true;
//       crdt.otherSources(this).forEach(function (otherSource) {
//         promises.push(otherSource.broadcast(operation));
//       });
//     }
//   }
//   if (override && typeof override.then === 'function') {
//     promises.push(override);
//   }
//   // this.relays.forEach(function (relay) { relay.publish(operation); });
//   return Promise.all(promises);
// };

// // `Source:operationEvent` --
// Source.prototype.operationEvent = 'operation';

// **Source:deliver(operation)** --
Source.prototype.deliver = function (operation, override) {
//   debug.log(this.type + '..deliver:', '', '\n', operation.toString());
//   // operation = this.cleanOperation(operation);
//   var //event = this.operationEvent,
//       promises = [];
//   // this.remote.emit(event, operation.toString());
//   promises.push(this.invoke(operation));
//   if (override && typeof override.then === 'function') {
//     promises.push(override);
//   }
//   return Promise.all(promises);
// };

// // **Source:invoke(operation)** --
// Source.prototype.invoke = function (operation, override) {
  debug.log(this.type + '..invoke:', '', '\n', operation.toString());
  var promises = [];
  // Sync and delete are special operations.
  // Sync reads all operations for a given identity.
  if (operation.method === 'sync') {
    promises.push(this.sync(operation, override));
  }
  // Any operation that isn't sync will be stored when they are appended.
  // It is up to the sync method to send a response.
  else {
    promises.push(this.append(operation));
    // promises.push(this.broadcast(operation));
  }
  // Delete will remove a CRDT from storage and memeory.
  if (operation.method === 'delete') {
    promises.push(this.delete(operation, override));
  }
  if (override && typeof override.then === 'function') {
    promises.push(override);
  }
  return Promise.all(promises);
};

// **Source:append(operation)** --
Source.prototype.append = function (operation, override) {
  debug.log(this.type + '..append:', '', '\n', operation.toString());
  return override || this.emptyPromise(this);
};

// **Source:sync(operation)** --
Source.prototype.sync = function (operation, override) {
  debug.log(this.type + '..sync:', '', '\n', operation.toString());
  var promises = [];
  this.get(operation, {sources: [this]});
  if (override && typeof override.then === 'function') {
    promises.push(override);
  }
  return new Promise(function (resolve, reject) {
    Promise.all(promises).then(function () {
      this.broadcast(operation).then(resolve, reject);
    }.bind(this), reject);
  }.bind(this));
};

// **Source:delete(operation)** --
Source.prototype.delete = function (operation, override) {
  debug.log(this.type + '..delete:', '', '\n', operation.toString());
  return override || this.emptyPromise(this);
};

// **TODO:** -- Add compress method.
// ```javascript
// Source.prototype.compress = function (override) {
//   debug.log(this.type + '..compress');
//   return override || this.emptyPromise(this);
// };
// ```

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
