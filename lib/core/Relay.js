// # Relay
// [lib/index.js](../index.html) > lib/core/Relay.js
'use strict';

var events = require('events');//,
    // util = require('util');

var common = require('../common.js'),
    debug = require('../debug.js');

var CRDT = require('./ConflictFreeReplicatedDataType.js'),
    // debug = require('../debug.js');//,
    // Operation = require('./Operation.js');
CRDT = CRDT.CRDT || CRDT;

module.exports = Relay;

// ### Constructor

// * `source` --
// * `stream` --
// function Relay(crdt, stream) {
function Relay(options) {
  // this.type = this.constructor.name;
  // this.source = source;
  // this.stream = stream;
  this.isOpen = false;
  this.options = options || {};
  this.peers = [];
  // this.relays = [];
  this.type = this.constructor.type;
  debug.log(this.type + '..init:', '', '\n', this.options);
  this.init();
  return this;
}

Relay.type = 'BaseRelay';

// **Source.adapt(type)** --
Relay.adapt = common.adaptClass(Relay);

// **Source.define(name, func)** --
Relay.define = common.defineMethod;

// ### Prototype

// `Relay:messageEvent` --
Relay.prototype.messageEvent = 'message';

// `Relay:closeEvent` --
Relay.prototype.closeEvent = 'close';

// **Relay:connect(stream)** --
Relay.prototype.connect = function (stream) {
  if (this.isConnected) {return this;}
  debug.log(this.type + '..connect');
  this.isConnected = true;
  this.messageHandler = this.messageReceiver.bind(this);
  this.closeHandler = this.disconnect.bind(this);
  this.stream.on(this.messageEvent, this.messageHandler);
  this.stream.on(this.closeEvent, this.closeHandler);
  return this;
};

// **Relay:disconnect()** --
Relay.prototype.disconnect = function (stream) {
  if (!this.isConnected) { return this; }
  debug.log(this.type + '..disconnect');
  this.source.forgetRelay(this);
  this.stream.removeListener(this.messageEvent, this.messageHandler);
  this.stream.removeListener(this.closeEvent, this.closeHandler);
  delete this.messageHandler;
  delete this.closeHandler;
  delete this.isConnected;
  return this;
};

// **Relay:messageReceiver(operation)** --
Relay.prototype.messageReceiver = function (operation) {
  debug.log(this.type + '..message-handler:', '', '\n', operation.toString());
  operation = this.source.cleanOperation(operation);
  this.source.deliver(operation);
  // var crdt = this.source.get(operation);
  // if (crdt) { crdt.sourceProxy(operation, this.source); }
};

// **Relay:publish(operation)** --
Relay.prototype.publish = function (operation) {
  // **TODO:** This method should be renamed.
  if (!this.isConnected) { return; }
  operation = this.source.cleanOperation(operation).toString();
  debug.log(this.type + '..operation', '', '\n', operation);
  this.stream.send(operation);
};

// ### Prototype

// Source.prototype.Operation = Operation;
// Source.prototype.Relay = Relay;

// **Relay:init()** --
Relay.prototype.init = function () {};

// **Relay:emptyPromise(value)** --
Relay.prototype.emptyPromise = common.emptyPromise;

// **Relay:open()** --
Relay.prototype.open = function (override) {
  debug.log(this.type + '..open');
  if (this.isOpen) { return this.emptyPromise(this); }
  this.isOpen = true;
  this.remote = this.remote || new events.EventEmitter();
  this.remote.emit('open');
  return override || this.emptyPromise(this);
};

// **Relay:close()** --
Relay.prototype.close = function (override) {
  debug.log(this.type + '..close');
  if (!this.isOpen) { return this.emptyPromise(this); }
  this.isOpen = false;
  this.remote.emit('close', this);
  delete this.remote;
  return override || this.emptyPromise(this);
};

// **Relay:free()** --
Relay.prototype.free = function () {
  debug.log(this.type + '..free');
  this.peers.forEach(this.disconnect.bind(this));
  this.peers = [];
  return this.clear();
};

// **Relay:clear()** --
Relay.prototype.clear = function (override) {
  debug.log(this.type + '..clear');
  return override || this.emptyPromise(this);
};

// **Relay:load()** --
Relay.prototype.load = function (override) {
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

// **Relay:get(operation)** --
Relay.prototype.get = common.getCRDT;

// // **Source:otherSources(crdt)** --
// Source.prototype.otherSources = function (crdt) {
//   return crdt.otherSources(this);
// };

// **Source:broadcast(operation)** --
Relay.prototype.broadcast = function (operation, override) {
  debug.log(this.type + '..broadcast:', '', '\n', operation.toString());
  var crdt = this.get(operation),
      promises = [];
  if (crdt) {
    promises.push(crdt.invoke(operation));
    if (!operation.noOtherSources) {
      operation.noOtherSources = true;
      crdt.otherSources(this).forEach(function (otherSource) {
        promises.push(otherSource.broadcast(operation));
      });
    }
  }
  if (override && typeof override.then === 'function') {
    promises.push(override);
  }
  // this.relays.forEach(function (relay) { relay.publish(operation); });
  return Promise.all(promises);
};

// `Relay:operationEvent` --
Relay.prototype.operationEvent = 'operation';

// **Relay:publish(operation)** --
Source.prototype.publish = function (operation, override) {
  debug.log(this.type + '..deliver:', '', '\n', operation.toString());
  operation = this.cleanOperation(operation);
  var event = this.operationEvent,
      promises = [];
  this.remote.emit(event, operation.toString());
  promises.push(this.invoke(operation));
  if (override && typeof override.then === 'function') {
    promises.push(override);
  }
  return Promise.all(promises);
};

// // **Source:invoke(operation)** --
// Source.prototype.invoke = function (operation, override) {
//   debug.log(this.type + '..invoke:', '', '\n', operation.toString());
//   var promises = [];
//   // Sync and delete are special operations.
//   // Sync reads all operations for a given identity.
//   if (operation.method === 'sync') {
//     promises.push(this.sync(operation, override));
//   }
//   // Any operation that isn't sync will be stored when they are appended.
//   // It is up to the sync method to send a response.
//   else {
//     promises.push(this.append(operation));
//     promises.push(this.broadcast(operation));
//   }
//   // Delete will remove a CRDT from storage and memeory.
//   if (operation.method === 'delete') {
//     promises.push(this.delete(operation, override));
//   }
//   if (override && typeof override.then === 'function') {
//     promises.push(override);
//   }
//   return Promise.all(promises);
// };
//
// // **Source:append(operation)** --
// Source.prototype.append = function (operation, override) {
//   debug.log(this.type + '..append:', '', '\n', operation.toString());
//   return override || this.emptyPromise(this);
// };
//
// // **Source:sync(operation)** --
// Source.prototype.sync = function (operation, override) {
//   debug.log(this.type + '..sync:', '', '\n', operation.toString());
//   var promises = [];
//   this.get(operation, {sources: [this]});
//   if (override && typeof override.then === 'function') {
//     promises.push(override);
//   }
//   return new Promise(function (resolve, reject) {
//     Promise.all(promises).then(function () {
//       this.broadcast(operation).then(resolve, reject);
//     }.bind(this), reject);
//   }.bind(this));
// };
//
// // **Source:delete(operation)** --
// Source.prototype.delete = function (operation, override) {
//   debug.log(this.type + '..delete:', '', '\n', operation.toString());
//   return override || this.emptyPromise(this);
// };


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
