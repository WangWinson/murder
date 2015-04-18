'use strict';

var author = require('./author.js'),
    sources = require('./sources.js'),
    relays = require('./relays.js');

exports.configureCRDT = function (CRDT, options) {
  options = options || {};
  CRDT.prototype.author = author(options.isServer);
  CRDT.prototype.sources = sources;
  CRDT.prototype.relays = relays;
};
