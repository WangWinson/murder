// # WebSocket Source
// [lib/index.js](../index.html) > lib/relays/WebSocketRelay.js
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

var WebSocketRelay = require('../core/Relay.js').adapt('WebSocketRelay');

module.exports = WebSocketRelay;

WebSocketRelay.prototype.websocket = function (params) {
  var isHTML5WebSocket = typeof WebSocket === 'function',
      Client = isHTML5WebSocket ? WebSocket : WebSocketClient,
      connection = new Client(params);
  connection.isHTML5WebSocket = isHTML5WebSocket;
  return connection;
};

// TODO: handle reconnecting when the ws loses connection.
WebSocketRelay.define('open', function (open) {
  return function () {
    return open.call(this, function () {
      var promise;
      if (!this.remote && this.options.url) {
        this.remote = this.websocket(this.options.url, this.options.protocols);
        if (this.remote.isHTML5WebSocket) {
          this.remote.on = function (event, listener) {
            if (this['on' + event]) {
              debug.warn(new Error('Replacing existing listener for: ' + event).stack);
            }
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
        // var ops = {i: {}, o: {}};
        this.remote.on('message', function (event) {
          var rawOperation = event.data;
          debug.log(this.type + '.relay..on-message:', '', '\n', rawOperation);
          // if (ops.i[rawOperation]) {
          //   debug.error(new Error('IN: REPEAT OPERATION').stack);
          //   return;
          // }
          // ops.i[rawOperation] = true;
          this.messageReceiver(rawOperation);
        }.bind(this));
        this.remote.emit = function (name, payload) {
          if (!source.isOpen) { promise = openPromise(); }
          promise.then(function () {
            if (name === 'message' || name === 'operation') {
              debug.warn(new Error('EMIT ' + name + ' -- ' + payload).stack);
              if (typeof payload !== 'string') {
                payload = JSON.stringify(payload);
              }
              debug.log(source.type + '.remote..send:', '', '\n', payload);
              // if (ops.o[payload]) {
              //   debug.error(new Error('OUT: REPEAT OPERATION').stack);
              //   return;
              // }
              // ops.o[payload] = true;
              this.send(payload);
            }
            else {
              source.emit.apply(source, arguments);
            }
          }.bind(this));
        };
      }
      return promise;
    });
  };
});

WebSocketRelay.define('close', function (close) {
  return function () {
    if (this.remote) {
      debug.log(this.type + '.remote..close');
      this.remote.close();
    }
    return close.call(this);
  };
});

// WebSocketRelay.define('publish', function (publish) {
//   return function () {
//     if (!this.operations)
//     return publish.call(this);
//   };
// });
