// # Relay
// [lib/index.js](../index.html) > lib/core/Relay.js
'use strict';

var debug = require('../debug.js');

module.exports = Relay;

// ### Constructor

// * `source` --
// * `stream` --
// * `_sources` --
function Relay(source, stream, _sources) {
  this.type = this.constructor.name;
  this.source = source;
  this.stream = stream;
  this.sources = [this.source].concat(_sources || []);
  return this;
}

// ### Prototype

// `Relay:messageEvent` --
Relay.prototype.messageEvent = 'message';

// `Relay:closeEvent` --
Relay.prototype.closeEvent = 'close';

// **Relay:connect()** --
Relay.prototype.connect = function () {
  if (this.isConnected) {return this;}
  debug.log(this.type + '..connect');
  this.isConnected = true;
  this.messageHandler = this.message.bind(this);
  this.closeHandler = this.disconnect.bind(this);
  this.stream.on(this.messageEvent, this.messageHandler);
  this.stream.on(this.closeEvent, this.closeHandler);
  return this;
};

// **Relay:disconnect()** --
Relay.prototype.disconnect = function () {
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

// **Relay:message(operation)** --
Relay.prototype.message = function (operation) {
  debug.log(this.type + '..message-handler:', '', '\n', operation.toString());
  operation = this.source.cleanOperation(operation);
  this.sources.forEach(function (source) { source.deliver(operation); }.bind(this));
  if (this.sources.length === 1) {
    var crdt = this.source.get(operation);
    if (crdt) { crdt.sourceProxy(operation, this.source); }
  }
};

// **Relay:operation(operation)** --
Relay.prototype.operation = function (operation) {
  // **TODO:** This method should be renamed.
  if (!this.isConnected) { return; }
  operation = this.source.cleanOperation(operation).toString();
  debug.log(this.type + '..operation', '', '\n', operation);
  this.stream.send(operation);
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
