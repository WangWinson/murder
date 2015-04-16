// # Example Sources
// [lib/index.js](index.html) > example/sources.js
'use strict';

exports = module.exports = [];

var isNodeJS = typeof window === 'undefined';

var NedbSource = require('../lib/sources/NedbSource.js'),
    WebStorageSource = require('../lib/sources/WebStorageSource.js');

var storage;

if (isNodeJS) {
  storage = new NedbSource({filename: __dirname + '/_database'});
}

else {
  // NOTE: WebStorageSource is actually a subclass of NedbSource.
  storage = new WebStorageSource({});
}

// Push each source to sources array.
exports.push(storage);

// Open all sources.
storage.open();

// Make it easy to select a specific source form the sources array.
exports.storage = storage;
