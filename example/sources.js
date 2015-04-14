// # Example Sources
// [lib/index.js](index.html) > example/sources.js
'use strict';

var config = require('./config.js');

exports = module.exports = [];

var isNodeJS = typeof window === 'undefined';

var NedbSource = require('../lib/sources/NedbSource.js'),
    WebSocketSource = require('../lib/sources/WebSocketSource.js'),
    WebStorageSource = require('../lib/sources/WebStorageSource.js');

var socket_source,
    storage_source;

if (isNodeJS) {
  socket_source = new WebSocketSource({});
  storage_source = new NedbSource({filename: __dirname + '/_database'});
}

else {
  socket_source = new WebSocketSource({url: config.webSocketClientUrl});
  // NOTE: WebStorageSource is actually a subclass of NedbSource.
  storage_source = new WebStorageSource({});
}

// Push each source to sources array.
exports.push(storage_source);
exports.push(socket_source);

// Open all sources.
socket_source.open();
storage_source.open();

// Make it easy to select a specific source form the sources array.
exports.socket = socket_source;
exports.storage = storage_source;
