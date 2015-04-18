// # NeDB Source
// [lib/index.js](../index.html) > lib/sources/NedbSource.js
'use strict';

var NedbDatabase = require('nedb');

var debug = require('../debug.js');

var NedbSource = require('../core/Source.js').adapt('NedbSource');

module.exports = NedbSource;

NedbSource.define('open', function (open) {
  return function () {
    return open.call(this, function () {
      this.database = new NedbDatabase({filename: this.options.filename});
      return this.load();
    });
  };
});

NedbSource.define('clear', function (clear) {
  return function () {
    return clear.call(this, new Promise(function (resolve, reject) {
      this.database.remove({}, {multi: true}, function (err, numRemoved) {
        debug.warn(this.type + ': Removed ' + numRemoved + ' CRDT operations from local database.');
        if (err) { reject(err); } else { resolve(this); }
      }.bind(this));
    }.bind(this)));
  };
});

NedbSource.define('load', function (load) {
  return function (dump) {
    return load.call(this, dump, new Promise(function (resolve, reject) {
      this.database.loadDatabase(function (err) {
        if (err) { return reject(err); }
        Promise.all([
          new Promise(function (y, n) {
            this.database.ensureIndex({fieldName: 'id'}, cb.bind(this, y, n));
          }.bind(this)),
          new Promise(function (y, n) {
            this.database.ensureIndex({fieldName: 'type'}, cb.bind(this, y, n));
          }.bind(this)),
          new Promise(function (y, n) {
            this.database.ensureIndex({fieldName: 'method'}, cb.bind(this, y, n));
          }.bind(this))
        ]).then(resolve, reject);
        function cb(resolve, reject, err) {
          /*jshint validthis:true*/
          if (err) { reject(err); } else { resolve(this); }
        }
      }.bind(this));
    }.bind(this)));
  };
});

NedbSource.define('append', function (append) {
  return function (operation, origin) {
    return append.call(this, operation, origin, new Promise(function (resolve, reject) {
      this.database.insert(operation, function (err) {
        if (err) { debug.error(this.type, err); }
        if (err) { reject(err); } else { resolve(this); }
      }.bind(this));
    }.bind(this)));
  };
});

NedbSource.define('sync', function (sync) {
  return function (operation, origin) {
    return new Promise(function (resolve, reject) {
      var query = {id: operation.id};
      this.database.find(query, function (err, log) {
        if (err) { return reject(err); }
        // debug.info('find', log);
        var override = Promise.all(log.map(function (operation) {
          return this.get(operation, true).invoke(operation, this, true);
        }.bind(this)));
        sync.call(this, operation, origin, override).then(resolve, reject);
      }.bind(this));
    }.bind(this));
  };
});

NedbSource.define('delete', function (delete_) {
  return function (operation, origin) {
    return delete_.call(this, operation, origin, new Promise(function (resolve, reject) {
      var query = {id: operation.id, $not: {method: 'delete'}};
      this.database.remove(query, {multi: true}, function (err, numRemoved) {
        debug.warn(this.type + ': Removed ' + numRemoved + ' CRDT operations from local database.');
        if (err) { reject(err); } else { resolve(this); }
      }.bind(this));
    }.bind(this)));
  };
});
