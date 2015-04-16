// # Relay
// [lib/index.js](../index.html) > lib/core/Relay.js
'use strict';

var events = require('events'),
    util = require('util');

var common = require('../common.js'),
    debug = require('../debug.js');

var Operation = require('./Operation.js');

module.exports = Relay;

// ### Constructor

// * `options` --
function Relay(options) {
  this.isOpen = false;
  this.options = options || {};
  this.peers = [];
  this.remote = null;
  this.type = this.constructor.type;
  debug.log(this.type + '..init:', '', '\n', this.options);
  this.init();
  return this;
}

util.inherits(Relay, events.EventEmitter);

Relay.type = 'BaseRelay';

// **Relay.adapt(type)** --
Relay.adapt = common.adaptClass(Relay);

// **Relay.define(name, func)** --
Relay.define = common.defineMethod;

// ### Prototype

// IMPORTANT
Relay.prototype.Operation = Operation;

// `Relay:messageEvent` --
Relay.prototype.messageEvent = 'message';

// `Relay:closeEvent` --
Relay.prototype.closeEvent = 'close';

// **Relay:connect(stream)** --
Relay.prototype.connect = function (stream) {
  debug.log(this.type + '..connect');
  var peer = {stream: stream};
  this.peers.push(peer);
  peer.closeHandler = this.disconnect.bind(this, stream);
  peer.messageHandler = this.messageReceiver.bind(this);
  stream.on(this.closeEvent, peer.closeHandler);
  stream.on(this.messageEvent, peer.messageHandler);
  peer.isConnected = true;
  return this;
};

// **Relay:disconnect()** --
Relay.prototype.disconnect = function (peer) {
  debug.log(this.type + '..disconnect');
  if (!peer.isConnected) { return this; }
  var index = this.peers.indexOf(peer);
  if (index !== -1) { this.peers.splice(index, 1); }
  peer.stream.removeListener(this.messageEvent, peer.messageHandler);
  peer.stream.removeListener(this.closeEvent, peer.closeHandler);
  delete peer.messageHandler;
  delete peer.closeHandler;
  delete peer.isConnected;
  delete peer.stream;
  return this;
};

// **Relay:messageReceiver(operation)** --
Relay.prototype.messageReceiver = function (operation, noBroadcast) {
  debug.log(this.type + '..message-handler:', '', '\n', operation.toString());
  var crdt = this.get(operation);
  if (crdt) { crdt.invoke(operation, this, noBroadcast === true); }
};

Relay.prototype.remotePublishMethod = 'emit';

Relay.prototype.peerPublishMethod = 'send';

// **Relay:publish(operation)** --
Relay.prototype.publish = function (operation) {
  operation = operation.toString();
  debug.log(this.type + '..publish', '', '\n', operation);
  if (this.remote)
   { this.remote[this.remotePublishMethod](this.messageEvent, operation); }
  this.peers.forEach(function (peer) {
    peer.stream[this.peerPublishMethod](operation);
  }.bind(this));
};

// **Relay:get(operation)** --
Relay.prototype.get = common.getCRDT;

// **Relay:init()** --
Relay.prototype.init = function () {};

// **Relay:emptyPromise(value)** --
Relay.prototype.emptyPromise = common.emptyPromise;

Relay.prototype.remoteEventMethod = 'emit';

// **Relay:open()** --
Relay.prototype.open = function (override, callback) {
  debug.log(this.type + '..open');
  if (this.isOpen) { return this.emptyPromise(this); }
  if (callback) { callback(); }
  this.isOpen = true;
  this.remote = this.remote || this;
  this.remote[this.remoteEventMethod]('open');
  return override || this.emptyPromise(this);
};

// **Relay:close()** --
Relay.prototype.close = function (override, callback) {
  debug.log(this.type + '..close');
  if (!this.isOpen) { return this.emptyPromise(this); }
  if (callback) { callback(); }
  this.isOpen = false;
  this.remote[this.remoteEventMethod]('close', this);
  this.remote = null;
  return override || this.emptyPromise(this);
};

// **Relay:free()** --
Relay.prototype.free = function () {
  debug.log(this.type + '..free');
  this.peers.forEach(this.disconnect.bind(this));
  this.peers = [];
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
