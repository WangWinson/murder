// # Example Sources
// [lib/index.js](index.html) > example/sources.js
'use strict';

var config = require('./config.js');

exports = module.exports = [];

var isNodeJS = typeof window === 'undefined';

var WebSocketRelay = require('../../lib/relays/WebSocketRelay.js');

var websocket;

if (!isNodeJS || global.example_client === true) {
  websocket = new WebSocketRelay({url: config.webSocketClientUrl});
}

else {
  websocket = new WebSocketRelay({});
}

// Push each source to sources array.
exports.push(websocket);

// Open all sources.
websocket.open();

// Make it easy to select a specific source form the sources array.
exports.websocket = websocket;
