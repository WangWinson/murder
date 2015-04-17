'use strict';
/*jshint mocha:true, -W030*/

var expect = require('chai').expect;

var client = require('../example/client.js');

console.log('gothere', client.crows);

describe('crows', function() {
  it('should exists', function () {
    expect(client.crows).to.be.ok;
  });
});
