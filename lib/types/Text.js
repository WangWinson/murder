// # Text
// [lib/index.js](../index.html) > lib/types/Text.js
'use strict';

var CRDT = require('../core/ConflictFreeReplicatedDataType.js');

var TextCRDT = CRDT.extend('Text');

module.exports = TextCRDT;

// TODO:

TextCRDT.defineOperation('insert', function (params, operation) {});

TextCRDT.defineOperation('remove', function (params, operation) {});
