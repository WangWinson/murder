// # Example Sources
// [lib/index.js](index.html) > example/sources.js
'use strict';

exports = module.exports = [];

var isNodeJS = typeof window === 'undefined';

var NedbSource = require('../lib/sources/NedbSource.js'),
    WebStorageSource = require('../lib/sources/WebStorageSource.js');

var storage_source;

if (isNodeJS) {
  storage_source = new NedbSource({filename: __dirname + '/_database'});
}

else {
  // NOTE: WebStorageSource is actually a subclass of NedbSource.
  storage_source = new WebStorageSource({});
}

// Push each source to sources array.
exports.push(storage_source);

// Open all sources.
storage_source.open();

// Make it easy to select a specific source form the sources array.
exports.storage = storage_source;
