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
Source.type = 'BaseSource';

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
Source.prototype.open = function (callback) {
  debug.log(this.type + '..open');

  if (this.isOpen) { return this.emptyPromise(); }
  this.isOpen = true;

  if (callback) { return callback.call(this); }

  return this.emptyPromise();
};

// **Source:close()** --
Source.prototype.close = function (callback) {
  debug.log(this.type + '..close');

  if (!this.isOpen) { return this.emptyPromise(); }
  this.isOpen = false;

  if (callback) { callback.call(this); }

  return this.emptyPromise();
};

// **Source:free()** --
Source.prototype.free = function () {
  debug.log(this.type + '..free');
  return this.clear();
};

// **Source:clear()** --
Source.prototype.clear = function (override) {
  debug.log(this.type + '..clear');
  return override || this.emptyPromise();
};

// **Source:load()** --
Source.prototype.load = function (override) {
  debug.log(this.type + '..load');
  return override || this.emptyPromise();
};

// **Source:get(operation)** --
Source.prototype.get = common.getCRDT;

// **Source:deliver(operation)** --
Source.prototype.deliver = function (operation, origin, callback) {
  debug.log(this.type + '..deliver:', '', '\n', operation.toString());

  if (origin === this) { return this.emptyPromise(); }

  var override = callback && callback.call(this),
      promises = [];

  // Sync and delete are special operations.
  // Sync reads all operations for a given identity.
  if (operation.method === 'sync')
    { promises.push(this.sync(operation, origin, override)); }

  // Delete will remove a CRDT from storage and memeory.
  if (operation.method === 'delete')
    { promises.push(this.delete(operation, origin, override)); }

  if (override && typeof override.then === 'function')
    { promises.push(override); }

  console.log('promises', promises);

  return Promise.all(promises).then(console.info, console.error);
};

// **Source:append(operation)** --
Source.prototype.append = function (operation, origin, override) {
  debug.log(this.type + '..append:', '', '\n', operation.toString());
  return override || this.emptyPromise(this);
};

// **Source:sync(operation)** --
Source.prototype.sync = function (operation, origin, override) {
  debug.log(this.type + '..sync:', '', '\n', operation.toString());

  var crdt = this.get(operation, true),
      promises = [crdt.broadcastSyncResponse(operation, origin)];

  console.log('got here two');

  if (override && typeof override.then === 'function')
    { promises.push(override); }

  return Promise.all(promises);
};

// **Source:delete(operation)** --
Source.prototype.delete = function (operation, origin, override) {
  debug.log(this.type + '..delete:', '', '\n', operation.toString());

  var crdt = this.get(operation);
  crdt.delete(null, operation, origin || this, true);

  return override || this.emptyPromise(this);
};

// **Source:compress(override)** --
Source.prototype.compress = function (override) {
  debug.log(this.type + '..compress');
  return override || this.emptyPromise(this);
};
