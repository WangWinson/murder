// # WebSocket Source
// [lib/index.js](../index.html) > lib/sources/WebSocketSource.js
'use strict';

if (typeof WebSocket !== 'function') {
  try {
    var WebSocketServer = require('faye-websocket' + ''),
        WebSocketClient = WebSocketServer.Client;
  } catch (err) {
    throw new Error('WebSocket client is not available.');
  }
}

var debug = require('../debug.js');

var WebSocketSource = require('../core/Source.js').adapt('WebSocketSource');

module.exports = WebSocketSource;

WebSocketSource.prototype.websocket = function (params) {
  var isHTML5WebSocket = typeof WebSocket === 'function',
      Client = isHTML5WebSocket ? WebSocket : WebSocketClient,
      connection = new Client(params);
  connection.isHTML5WebSocket = isHTML5WebSocket;
  return connection;
};

// TODO: handle reconnecting when the ws loses connection.
WebSocketSource.define('open', function (open) {
  return function () {
    if (this.isOpen) { return this.emptyPromise(this); }
    var promise;
    if (!this.remote && this.options.url) {
      this.remote = this.websocket(this.options.url, this.options.protocols);
      if (this.remote.isHTML5WebSocket) {
        this.remote.on = function (event, listener) {
          this['on' + event] = listener;
        };
      }
      var openPromise = function () {
        return new Promise(function (resolve) {
          this.remote.on('open', function (event) {
            debug.log(source.type + '.remote..on-open');
            resolve(event);
          });
        }.bind(this));
      }.bind(this);
      promise = openPromise();
      var source = this;
      this.remote.on('message', function (event) {
        var rawOperation = event.data;
        debug.log(this.type + '.remove..on-message:', '', '\n', rawOperation);
        this.invoke(this.cleanOperation(rawOperation));
      }.bind(this));
      this.remote.emit = function (name, payload) {
        if (!source.isOpen) { promise = openPromise(); }
        promise.then(function () {
          if (name === 'message' || name === 'operation') {
            if (typeof payload !== 'string') {
              payload = JSON.stringify(payload);
            }
            debug.log(source.type + '.remote..send:', '', '\n', payload);
            this.send(payload);
          }
        }.bind(this));
      };
    }
    return open.call(this, promise);
  };
});

WebSocketSource.define('close', function (close) {
  return function () {
    if (this.remote) {
      debug.log(this.type + '.remote..close');
      this.remote.close();
    }
    return close.call(this);
  };
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
