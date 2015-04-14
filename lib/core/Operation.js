// # Operation
// [lib/index.js](../index.html) > lib/core/Operation.js
'use strict';

var debug = require('../debug.js');

module.exports = Operation;

// Format:
// "type$id#version@time|author.method:params"
// Delimters:
// [    $  #       @    |      .      :      ]

// ### Constructor

// * `type` --
// * `id` --
// * `version` --
// * `time` --
// * `author` --
// * `method` --
// * `params` --
/*jshint maxparams:8*/
function Operation(type, id, version, time, author, method, params) {
  this.type    = type || '';
  this.id      = id || '';
  this.version = version || 0;
  this.time    = time || Date.now();
  this.author  = author || '';
  this.method  = method || '';
  this.params  = params || null;
  return this;
}

// **Operation.fromJSON(jsonObject)** --
Operation.fromJSON = function (jsonObject) {
  return new Operation().fromJSON(jsonObject);
};

// **Operation.parse(string)** --
Operation.parse = function (string) {
  return new Operation().parse(string);
};

// ### Prototype

// **Operation:fromJSON(jsonObject)** --
Operation.prototype.fromJSON = function (jsonObject) {
  if (typeof jsonObject === 'string') { jsonObject = JSON.parse(jsonObject); }
  this.type = jsonObject.type;
  this.id = jsonObject.id;
  this.version = jsonObject.version;
  this.time = jsonObject.time;
  this.author = jsonObject.author;
  this.method = jsonObject.method;
  this.params = jsonObject.params;
  return this;
};

// **Operation:parse(string)** --
Operation.prototype.parse = function (string) {
  function shift(char) {
    var index = string.indexOf(char);
    if (index === -1) {
      debug.error('Malformed operation:', string);
      throw new Error('CRDT: Malformed operation.');
    }
    var fragment = string.substring(0, index);
    string = string.substring(index + 1, string.length);
    return fragment;
  }
  this.type    = shift('$');
  this.id      = shift('#');
  this.version = parseInt(shift('@'), 32);
  this.time    = parseInt(shift('|'), 32);
  this.author  = shift('.');
  this.method  = shift(':');
  try {
    this.params  = string ? JSON.parse(string) : (string || '');
  } catch (err) { throw err; }
  return this;
};

// **Operation:continuationHash()** --
Operation.prototype.continuationHash = function () {
  return this.version.toString(32) +
    '@' + this.time.toString(32) +
    '|' + this.author +
    '.' + this.method;
};

// **Operation:toString()** --
Operation.prototype.toString = function () {
  var params = this.params ? JSON.stringify(this.params) : (this.params || '');
  return this.type +
    '$' + this.id +
    '#' + this.version.toString(32) +
    '@' + this.time.toString(32) +
    '|' + this.author +
    '.' + this.method +
    ':' + params;
};

// ## ISC LICENSE

// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that there is no copyright notice
// and this permission notice appear in all copies.

// **THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
// OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
// OF THIS SOFTWARE.**
