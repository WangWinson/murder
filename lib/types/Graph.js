// # Graph
// [lib/index.js](../index.html) > lib/types/Graph.js
'use strict';

var CRDT = require('../core/ConflictFreeReplicatedDataType.js');

var Graph = CRDT.extend('Graph');

module.exports = Graph;

// TODO:

Graph.defineOperation('addEdge', function (params, operation) {});

Graph.defineOperation('addVertex', function (params, operation) {});

Graph.defineOperation('removeEdge', function (params, operation) {});

Graph.defineOperation('removeVertex', function (params, operation) {});

Graph.prototype.query = function () {};
