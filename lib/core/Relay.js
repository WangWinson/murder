// # Relay
// [lib/index.js](../index.html) > lib/core/Relay.js
'use strict';

var events = require('events'),
    util = require('util');

var common = require('../common.js'),
    debug = require('../debug.js');

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

  // if (!peer.isConnected) { return this; }

  var index = this.peers.indexOf(peer);
  if (index !== -1) { this.peers.splice(index, 1); }

  if (peer.stream && peer.stream.removeListener) {
    peer.stream.removeListener(this.messageEvent, peer.messageHandler);
    peer.stream.removeListener(this.closeEvent, peer.closeHandler);
  }

  delete peer.messageHandler;
  delete peer.closeHandler;
  delete peer.isConnected;
  delete peer.stream;

  return this;
};

// **Relay:messageReceiver(operation)** --
Relay.prototype.messageReceiver = function (operation, noBroadcast) {
  debug.log(this.type + '..message-receiver:', '', operation.toString());

  var crdt = this.get(operation, true);
  crdt.invoke(operation, this, noBroadcast === true);
};

Relay.prototype.remotePublishMethod = 'emit';

Relay.prototype.peerPublishMethod = 'send';

// **Relay:publish(operation, origin)** --
Relay.prototype.publish = function (operation) {
  debugger;
  operation = operation.toString();
  debug.log(this.type + '..publish:', '', operation.toString());

  this.remotePublish(operation);
  this.peersPublish(operation);

  var autoSyncWithNoRemotes = operation.method === 'sync' &&
                              !this.peers.length &&
                              (!this.remote || this.remote === this);

  if (autoSyncWithNoRemotes) {
    var crdt = this.get(operation, true);
    return crdt.broadcastSyncResponse(crdt.Operation.create(operation, true), this);
  }

  return this.emptyPromise();
};

Relay.prototype.publishContinuation = function (operation, origin) {
  operation = operation.toString();
  debug.log(this.type + '..publishContinuation:', '', operation.toString());

  if (origin !== this) { this.remotePublish(operation); }
  this.peersPublish(operation);
};

Relay.prototype.peersPublish = function (operation) {
  this.peers.forEach(function (peer) {
    try { peer.stream[this.peerPublishMethod](operation); }
    catch (error) {
      debug.error(this.type + '..publish-peer: ', 'Error', '\n', error);
      this.disconnect(peer);
    }
  }.bind(this));
};

Relay.prototype.remotePublish = function (operation) {
    if (this.remote)
     { this.remote[this.remotePublishMethod](this.messageEvent, operation); }
};

// **Relay:get(operation)** --
Relay.prototype.get = common.getCRDT;

// **Relay:init()** --
Relay.prototype.init = function () {};

// **Relay:emptyPromise(value)** --
Relay.prototype.emptyPromise = common.emptyPromise;

Relay.prototype.remoteEventMethod = 'emit';

// **Relay:open()** --
Relay.prototype.open = function (callback) {
  debug.log(this.type + '..open');

  if (this.isOpen) { return this.emptyPromise(); }
  this.isOpen = true;

  var override;
  if (callback) { override = callback.call(this); }

  debugger;
  this.remote = this.remote || this;
  this.remote[this.remoteEventMethod]('open');

  this.remote.on(this.messageEvent, function (operation) {
    if (operation.data) { operation = operation.data; }
    this.messageReceiver(operation, true);
  }.bind(this));

  return override || this.emptyPromise();
};

// **Relay:close()** --
Relay.prototype.close = function (callback) {
  debug.log(this.type + '..close');

  if (!this.isOpen) { return this.emptyPromise(); }
  this.isOpen = false;

  if (this.remote) {
    this.remote[this.remoteEventMethod]('close', this);
    this.remote = null;
  }

  if (callback) { return callback.call(this); }
  return this.emptyPromise();
};

// **Relay:free()** --
Relay.prototype.free = function () {
  debug.log(this.type + '..free');

  this.peers.forEach(this.disconnect.bind(this));
  this.peers = [];

  return this;
};
