// # Redis Source
// [lib/index.js](../index.html) > lib/sources/RedisSource.js
'use strict';

var redis = require('redis');

var debug = require('../debug.js');

var RedisSource = require('../core/Source.js').adapt('RedisSource');

module.exports = RedisSource;

// TODO: finish implementation.

RedisSource.define('open', function (open) {
  return function () {
    if (this.isOpen) { return this.emptyPromise(this); }
    // this.database = new NedbDatabase({filename: this.options.filename});
    return open.call(this, this.load());
  };
});

RedisSource.define('clear', function (clear) {
  return function () {
    return clear.call(this, new Promise(function (resolve, reject) {
      // this.database.remove({}, {multi: true}, function (err, numRemoved) {
      //   debug.warn(this.type + ': Removed ' + numRemoved + ' CRDT operations from local database.');
      //   if (err) { reject(err); } else { resolve(this); }
      // }.bind(this));
    }.bind(this)));
  };
});

RedisSource.define('load', function (load) {
  return function (dump) {
    return load.call(this, dump, new Promise(function (resolve, reject) {
      // this.database.loadDatabase(function (err) {
      //   if (err) { return reject(err); }
      //   Promise.all([
      //     new Promise(function (y, n) {
      //       this.database.ensureIndex({fieldName: 'id'}, cb.bind(this, y, n));
      //     }.bind(this)),
      //     new Promise(function (y, n) {
      //       this.database.ensureIndex({fieldName: 'type'}, cb.bind(this, y, n));
      //     }.bind(this)),
      //     new Promise(function (y, n) {
      //       this.database.ensureIndex({fieldName: 'method'}, cb.bind(this, y, n));
      //     }.bind(this))
      //   ]).then(resolve, reject);
      //   function cb(resolve, reject, err) {/*jshint validthis:true*/
      //     if (err) { reject(err); } else { resolve(this); }
      //   }
      // }.bind(this));
    }.bind(this)));
  };
});

RedisSource.define('append', function (append) {
  return function (operation) {
    return append.call(this, operation, new Promise(function (resolve, reject) {
      // this.database.insert(operation, function (err) {
      //   if (err) { debug.error(this.type, err); }
      //   if (err) { reject(err); } else { resolve(this); }
      // }.bind(this));
    }.bind(this)));
  };
});

RedisSource.define('sync', function (sync) {
  return function (operation) {
    return new Promise(function (resolve, reject) {
      // var query = {id: operation.id};
      // this.database.find(query, function (err, log) {
      //   if (err) { return reject(err); }
      //   debug.info('find', log);
      //   this.cache = this.cache || {};
      //   var override = Promise.all(log.map(this.broadcast.bind(this)));
      //   sync.call(this, operation, override).then(resolve, reject);
      // }.bind(this));
    }.bind(this));
    // return sync.call(this, operation, promise);//origin, );
  };
});

RedisSource.define('delete', function (delete_) {
  return function (operation) {
    return delete_.call(this, operation, new Promise(function (resolve, reject) {
      // var query = {id: operation.id, $not: {method: 'delete'}};
      // this.database.remove(query, {multi: true}, function (err, numRemoved) {
      //   debug.warn(this.type + ': Removed ' + numRemoved + ' CRDT operations from local database.');
      //   if (err) { reject(err); } else { resolve(this); }
      // }.bind(this));
    }.bind(this)));
  };
});
