'use strict';
/*jshint mocha:true, -W030*/
require('../lib/phantom.js');

var expect = require('chai').expect;

var Operation = require('../../lib/core/Operation.js');

describe('Operation', function() {
  it('should exist', function () {
    expect(Operation).to.be.ok;
  });
});
