'use strict';
/*jshint mocha:true, -W030*/
require('../lib/phantom.js');

var expect = require('chai').expect;

var Relay = require('../../lib/core/Relay.js');

describe('Relay', function() {
  it('should exist', function () {
    expect(Relay).to.be.ok;
  });
});
