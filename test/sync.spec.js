'use strict';
/*jshint mocha:true, -W030*/
require('./lib/phantom.js');

var expect = require('chai').expect;

var system = require('./lib/system.js');

describe('CRDT:sync()', function() {
  describe('an empty CRDT', function () {
    it('should sync', function (done) {
      var crdt = new system.CRDT();
      expect(crdt).to.be.ok;
      crdt.sync().then(function () { done(); }, done);
    });
  });

  xdescribe('a basic CRDT', function () {
    it('should sync', function (done) {
      var crdt = new system.CRDT(null, {
        relays: [new system.Relay()],
        sources: [new system.Source()]
      });
      expect(crdt).to.be.ok;
      crdt.sync().then(function () { done(); }, done);
    });
  });
});
