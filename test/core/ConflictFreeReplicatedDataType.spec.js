'use strict';
/*jshint mocha:true, -W030*/

var expect = require('chai').expect;

var CRDT = require('../../lib/core/ConflictFreeReplicatedDataType.js');

describe('CRDT', function() {
  it('should exists', function () {
    expect(CRDT).to.be.ok;
  });
});
