'use strict';
/*jshint mocha:true, -W030*/
require('../lib/phantom.js');

var expect = require('chai').expect;

var CRDT = require('../../lib/core/ConflictFreeReplicatedDataType.js');

describe('CRDT', function() {
  it('should exist', function () {
    expect(CRDT).to.be.ok;
  });
});
