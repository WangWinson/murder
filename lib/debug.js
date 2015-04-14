// # Source
// [lib/index.js](index.html) > lib/debug.js
'use strict';

var debug = require('debug');

exports = module.exports = debug;

exports.log = debug('murder:log');
exports.log.log = console.log.bind(console);

exports.info = debug('murder:info');
exports.info.log = console.info.bind(console);

exports.warn = debug('murder:warn');
exports.warn.log = console.warn.bind(console);

exports.error = debug('murder:error');
exports.error.log = console.error.bind(console);
