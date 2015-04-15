// # Example Sources
// [lib/index.js](index.html) > example/sources.js
'use strict';

var config = require('./config.js');

exports = module.exports = [];

var isNodeJS = typeof window === 'undefined';

var WebSocketRelay = require('../lib/sources/WebSocketRelay.js');

var socket_relay;

if (isNodeJS) {
  socket_relay = new WebSocketRelay({});
}

else {
  socket_relay = new WebSocketRelay({url: config.webSocketClientUrl});
}

// Push each source to sources array.
exports.push(socket_relay);

// Open all sources.
socket_relay.open();

// Make it easy to select a specific source form the sources array.
exports.socket = socket_relay;
