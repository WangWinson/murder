'use strict';

var util = require('util');

var CRDT = require('./core/ConflictFreeReplicatedDataType.js');

CRDT = CRDT.CRDT || CRDT;

exports.defineMethod = function (name, methodProvider) {
  return this.prototype[name] = methodProvider(this.prototype[name]);
};

exports.adaptClass = function (Base) {
  return function (type) {
    function Adapter() { return Base.apply(this, arguments); }
    util.inherits(Adapter, this);
    Adapter.type = type;
    Adapter.adapt = this.adapt;
    Adapter.define = this.define;
    return Adapter;
  };
};

exports.emptyPromise = function (resolution, rejection) {
  resolution = resolution || this;
  return new Promise(function (resolve, reject) {
    if (rejection) { reject(rejection); }
    else { resolve(resolution); }
  });
};

exports.getCRDT = function (operation, ensure) {
  operation = this.Operation.create(operation);
  var Type = CRDT.getType(operation.type);
  return Type.getById(operation.id, ensure);
};
