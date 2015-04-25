// # NeDB Source
// [lib/index.js](../index.html) > lib/sources/NedbSource.js
'use strict';

var fs = require('fs'),
    NedbDatastore = require('nedb');

var debug = require('../debug.js');

var NedbSource = require('../core/Source.js').adapt('NedbSource');

module.exports = NedbSource;

NedbSource.define('open', function (open) {
  return function () {
    return open.call(this, function () {
      this.docs = {};
      return new Promise(function (resolve, reject) {
        if (this.options.fsDir) {
          fs.mkdir(this.options.fsDir, function (err) {
            if (err) { return reject(err); }
            resolve(this);
          }.bind(this));
        }
        else { resolve(this); }
      }.bind(this));
    });
  };
});

NedbSource.prototype.autoCompactInterval = 120000;

NedbSource.define('load', function (load) {
  return function (id) {
    return load.call(this, new Promise(function (resolve, reject) {
      id = this.identitify(id);
      var opts = {};
      if (this.options.fsDir)
        { opts.filename = this.options.fsDir + '/' + id; }
      var doc = this.docs[id] || (this.docs[id] = new NedbDatastore(opts));
      if (!this.options.fsDir || doc.executor.ready) { return resolve(this); }
      doc.loadDatabase(function (err) {
        if (err) { return reject(err); }
        doc.ensureIndex({fieldName: 'method'}, function (err) {
          if (err) { reject(err); }
          else {
            doc.persistence.setAutocompactionInterval(this.autoCompactInterval);
            resolve(this);
          }
        }.bind(this));
      }.bind(this));
    }.bind(this)));
  };
});

NedbSource.prototype.getDoc = function (operation, callback) {
  var id = this.identitify(operation);
  return this.load(operation).then(function () {
    callback(this.docs[id]);
  }.bind(this), function (err) { throw err; });
};

NedbSource.define('clear', function (clear) {
  return function () {
    clear.call(this);
    return Promise.all(Object.keys(this.docs).map(function (name) {
      return this.delete(name);
    }.bind(this)));
  };
});

NedbSource.define('append', function (append) {
  return function (operation, origin) {
    return append.call(this, operation, origin, new Promise(function (resolve, reject) {
      this.getDoc(operation, function (store) {
        var entry = {
          _id: operation._id,
          type: operation.type,
          id: operation.id,
          version: operation.version,
          time: operation.time,
          author: operation.author,
          method: operation.method,
          params: operation.params
        };
        store.insert(entry, function (err) {
          operation._id = operation._id || entry._id;
          if (err) { debug.error(this.type, err); }
          if (err) { reject(err); } else { resolve(this); }
        }.bind(this));
      }.bind(this));
    }.bind(this)));
  };
});

NedbSource.define('sync', function (sync) {
  return function (operation, origin) {
    return new Promise(function (resolve, reject) {
      this.getDoc(operation, function (store) {
        store.find({}, function (err, log) {
          if (err) { return reject(err); }
          var crdt = this.get(operation, true);
          var override = Promise.all(log.map(function (operation) {
            return crdt.append(operation, this, true);
          }.bind(this)));
          crdt.resolveState(function () {
            sync.call(this, operation, origin, override).then(resolve, reject);
          }.bind(this));
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };
});

NedbSource.define('delete', function (delete_) {
  return function (operation, origin) {
    return delete_.call(this, operation, origin, new Promise(function (resolve, reject) {
      var id = this.identitify(operation);
      delete this.docs[id];
      if (this.options.fsDir) {
        var file = this.options.fsDir + '/' + id;
        fs.writeFile(file, '', function (err) {
          if (err) {
            console.error(new Error('Failed to remove store: ' + file).stack);
            return reject(err);
          }
          // resolve(this);
          fs.unlink(file, function (err) {
            if (err) { console.error(new Error('Failed to remove store: ' + file).stack); }
            if (err) { reject(err); } else { resolve(this); }
          }.bind(this));
        }.bind(this));
      }
      else {
        resolve(this);
      }
    }.bind(this)));
  };
});

NedbSource.define('compress', function (compress) {
  return function (syncOperation) {
    var promise =  new Promise(function (resolve, reject) {
      var identity = this.identitify(syncOperation);
      this.getDoc(identity, function (store) {
        debug.log(this.type + '..compress-wrapper-doc');
        var query = {time: {$lt: syncOperation.time}};
        store.remove(query, {multi: true}, function (err, numRemoved) {
          debug.log(this.type + '..compress-wrapper-removed');
          if (err) { return reject(err); }
          // store.persistence.compactDatafile();
          debug.log('Removed ' + numRemoved + ' entries from: ' + identity);
          this.append(syncOperation, this, true).then(resolve, reject);
        }.bind(this));
      }.bind(this));
    }.bind(this));
    return compress.call(this, syncOperation, promise);
  };
});
