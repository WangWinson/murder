// # WebStorage Source
// [lib/index.js](../index.html) > lib/sources/WebStorageSource.js
'use strict';

var WebStorageSource = require('./NedbSource.js').adapt('WebStorageSource');

module.exports = WebStorageSource;

WebStorageSource.prototype.init = function () {
  this.options = this.options || {};
  // NOTE: Nedb docs seem to say that filename should be set to localStorage
  //       in order to use localStorage but this causes an exception.
  // this.options.filename = 'localStorage';
};
