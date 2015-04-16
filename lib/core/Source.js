// # Source
// [lib/index.js](../index.html) > lib/core/Source.js

// This class has overloaded responability. This was done in order to reduce the
// complexity of the core system.
//
// A source can be used to implement a local storage mechanism for CRDT data.
// It can also be used to add support for various message protocols.
//
// Generally, sources do one of the two, but a source could be adapted to do both at once.
'use strict';
/*global Promise*/

var common = require('../common.js'),
    debug = require('../debug.js');

var Operation = require('./Operation.js');

module.exports = Source;

// ### Constructor

// * `options` --
function Source(options) {
  this.isOpen = false;
  this.options = options || {};
  this.type = this.constructor.type;
  debug.log(this.type + '..init:', '', '\n', this.options);
  this.init();
  return this;
}

// All sources must have a type.
Source.type = 'LocalSource';

// **Source.adapt(type)** --
Source.adapt = common.adaptClass(Source);

// **Source.define(name, func)** --
Source.define = common.defineMethod;

// ### Prototype

// IMPORTANT
Source.prototype.Operation = Operation;

// **Source:init()** --
Source.prototype.init = function () {};

// **Source:emptyPromise(value)** --
Source.prototype.emptyPromise = common.emptyPromise;

// **Source:open()** --
Source.prototype.open = function (override, callback) {
  debug.log(this.type + '..open');
  if (this.isOpen) { return this.emptyPromise(this); }
  if (callback) { callback(); }
  this.isOpen = true;
  return override || this.emptyPromise(this);
};

// **Source:close()** --
Source.prototype.close = function (override, callback) {
  debug.log(this.type + '..close');
  if (!this.isOpen) { return this.emptyPromise(this); }
  if (callback) { callback(); }
  this.isOpen = false;
  return override || this.emptyPromise(this);
};

// **Source:free()** --
Source.prototype.free = function () {
  debug.log(this.type + '..free');
  return this.clear();
};

// **Source:clear()** --
Source.prototype.clear = function (override) {
  debug.log(this.type + '..clear');
  return override || this.emptyPromise(this);
};

// **Source:load()** --
Source.prototype.load = function (override) {
  debug.log(this.type + '..load');
  return override || this.emptyPromise(this);
};

// **Source:get(operation)** --
Source.prototype.get = common.getCRDT;

// **Source:deliver(operation)** --
Source.prototype.deliver = function (operation, override) {
  debug.log(this.type + '..deliver:', '', '\n', operation.toString());

  var promises = [];

  // Sync and delete are special operations.
  // Sync reads all operations for a given identity.
  if (operation.method === 'sync')
    { promises.push(this.sync(operation, override)); }

  // Delete will remove a CRDT from storage and memeory.
  if (operation.method === 'delete')
    { promises.push(this.delete(operation, override)); }

  if (override && typeof override.then === 'function')
    { promises.push(override); }

  return Promise.all(promises);
};

// **Source:append(operation)** --
Source.prototype.append = function (operation, override) {
  debug.log(this.type + '..append:', '', '\n', operation.toString());
  // Any operation that isn't sync will be stored when they are appended.
  // It is up to the sync method to send a response.
  // if (operation.method === 'sync' && !operation.params) { }
  return override || this.emptyPromise(this);
};

// **Source:sync(operation)** --
Source.prototype.sync = function (operation, override) {
  debug.log(this.type + '..sync:', '', '\n', operation.toString());
  var promises = [];
  this.get(operation, {sources: [this]});
  if (override && typeof override.then === 'function') {
    promises.push(override);
  }
  return new Promise(function (resolve, reject) {
    Promise.all(promises).then(function () {
      this.get(operation, true)
          .sync(operation.params, operation, this)
          .then(resolve, reject);
    }.bind(this), reject);
  }.bind(this));
};

// **Source:delete(operation)** --
Source.prototype.delete = function (operation, override) {
  debug.log(this.type + '..delete:', '', '\n', operation.toString());
  return override || this.emptyPromise(this);
};

// **TODO:** -- Add call to compress method.
Source.prototype.compress = function (override) {
  debug.log(this.type + '..compress');
  return override || this.emptyPromise(this);
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
