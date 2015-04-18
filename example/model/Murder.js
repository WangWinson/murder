// # Murder (of crows) CRDT
// [lib/index.js](index.html) > example/Murder.js
'use strict';

var Collection = require('../../lib/types/Collection.js'),
    common = require('../lib/common.js');

var Murder = Collection.extend('Murder');

module.exports = Murder;

// Declares the type of this collection.
Murder.prototype.Type = require('./Crow.js');

// Assign the author and sources for this
common.configureCRDT(Murder, {isServer: false});
