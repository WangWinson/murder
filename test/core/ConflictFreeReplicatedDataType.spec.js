'use strict';
/*jshint mocha:true, -W030*/
require('../lib/phantom.js');

var expect = require('chai').expect;

var CRDT = require('../../lib/core/ConflictFreeReplicatedDataType.js');

describe('CRDT', function() {
  it('should exist', function () {
    expect(CRDT).to.be.ok;
  });

  describe('CRDT:mergeState()', function () {
    it('should not replace existing objects', function () {
      var crdt = new CRDT();
      crdt.state = {objects: {0: 'a'}};
      crdt.mergeState({});
      expect(crdt.state.objects).to.be.ok;
      expect(crdt.state.objects[0]).to.be.ok;
    });

    it('should overwrite existing state', function () {
      var crdt = new CRDT();
      crdt.state = {objects: {0: 'a'}};
      crdt.mergeState({objects: {0: 'b', 1: 'c'}});
      expect(crdt.state.objects).to.be.ok;
      expect(crdt.state.objects[0]).to.equal('b');
      expect(crdt.state.objects[1]).to.be.ok;
    });
  });
});
