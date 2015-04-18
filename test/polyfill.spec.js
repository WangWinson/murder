'use strict';
/*jshint mocha:true, -W030*/
require('./lib/phantom.js');

var expect = require('chai').expect;

describe('es6', function () {
  it('bind', function () {
    expect(Function.prototype.bind).to.be.ok;
  });

  it('promises', function () {
    expect(global.Promise).to.be.ok;
  });
});
