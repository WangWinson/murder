// # Collection
// [lib/index.js](../index.html) > lib/types/Collection.js
'use strict';
/*global Promise*/

var CRDT = require('../core/ConflictFreeReplicatedDataType.js'),
    debug = require('../debug.js'),
    Model = require('./Model.js');

var Collection = CRDT.extend('Collection');

module.exports = Collection;

Collection.prototype.init = function () {
  this.refs = {};
  this.autoSync = false;
};

Collection.defineOperation('add', function (params, operation) {
  debug.log(this.type + '..add:', '', '\n', params);
  var id = params.id || params;
  if (typeof id !== 'string') { throw new Error('Can only add object ID.'); }
  this.state = this.state || {};
  this.state.objects = this.state.objects || {};
  this.state.objects[id] = true;
  if (!this.refs[id]) {
    this.refs[id] = new this.Type(id, this.author, this.sources);
    if (this.autoSync) { this.refs[id].sync(); }
  }
  operation.params = {id: id};
});

Collection.defineOperation('remove', function (params, operation) {
  debug.log(this.type + '..remove:', '', '\n', params);
  var id = params.id || params;
  if (typeof id !== 'string') { throw new Error('Can only remove object ID.'); }
  this.state = this.state || {};
  this.state.objects = this.state.objects || {};
  this.state.objects[id] = false;
  if (this.refs[id]) { this.refs[id].free(); }
  delete this.refs[id];
  operation.params = {id: id};
});

Collection.defineOperation('empty', function (_, operation) {
  debug.log(this.type + '..empty');
  var changes = {objects: null};
  this.refs = {};
  this.state = changes;
  return this.sync(changes, operation, true);
});

Collection.define('free', function (free) {
  return function () {
    this.refs = {};
    // NOTE: should this free all the refs?
    return free.call(this);
  };
});

Collection.prototype.Type = Model;

Collection.prototype.objects = function () {
  return this.state && this.state.objects || {};
};

Collection.prototype.collect = function () {
  return new Promise(function (resolve, reject) {
    var objects = this.objects();
    Promise.all(Object.keys(objects).map(function (id) {
      var object = objects[id] && new this.Type(id, this.author, this.sources);
      this.refs[id] = object;
      return object ? object.sync() : emptyPromise();
    }.bind(this))).then(resolve, reject);
  }.bind(this));
};

function emptyPromise(value) {
  return new Promise(function (resolve) { resolve(value); });
}

Collection.prototype.byId = function (id) {
  return new Promise(function (resolve, reject) {
    var object, exists;
    if (this.refs[id]) { object = this.refs[id]; }
    else {
      exists = this.objects()[id];
      if (!exists) { return resolve(null); }
    }
    object = object || new this.Type(id, this.author, this.sources);
    this.refs[id] = object;
    object.sync().then(function () { resolve(object); }, reject);
  }.bind(this));
};

Collection.prototype.toArray = function () {
  return Object.keys(this.refs).map(function (id) {
    return this.refs[id];
  }.bind(this)).filter(function (object) {
    return object;
  });
};
