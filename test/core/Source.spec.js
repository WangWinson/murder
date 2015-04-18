'use strict';
/*jshint mocha:true, -W030*/
require('../lib/phantom.js');

var expect = require('chai').expect;

var Source = require('../../lib/core/Source.js');

describe('Source', function() {
  it('should exist', function () {
    expect(Source).to.be.ok;
  });
});
