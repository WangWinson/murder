// # Operation
// [lib/index.js](../index.html) > lib/core/Operation.js

// Format:
// "type$id#version@time|author.method:params"
// Delimters:
// [    $  #       @    |      .      :      ]
'use strict';

module.exports = Operation;

// ### Constructor

// * `props.type` --
// * `props.id` --
// * `props.version` --
// * `props.time` --
// * `props.author` --
// * `props.method` --
// * `props.params` --
/*jshint maxparams:8*/
function Operation(props, forceClone) {
  if (!forceClone && props instanceof Operation) { return props; }
  return this.clone(props);
}

// **Operation.create(props)** --
Operation.create = function (props) {
  return new Operation(props);
};

// ### Prototype

Operation.prototype.type = null;
Operation.prototype.id = null;
Operation.prototype.version = null;
Operation.prototype.time = null;
Operation.prototype.author = null;
Operation.prototype.method = null;
Operation.prototype.params = null;
Operation.prototype.originParams = null;

// **Operation:clone(props)** --
Operation.prototype.clone = function (props) {
  if (typeof props === 'string') { return this.parse(props); }
  props = props || {};
  this.type    = props.type || '';
  this.id      = props.id || '';
  this.version = props.version || 0;
  this.time    = props.time || Date.now();
  this.author  = props.author || '';
  this.method  = props.method || '';
  this.params  = props.params || null;
  this.originParams = props.originParams || props.params;
  return this;
};

// **Operation:parse(string)** --
Operation.prototype.parse = function (string) {
  var first = string.charAt(0);
  if (first === '{' || first === '"')
    { return this.clone(JSON.parse(string)); }
  function shift(char) {
    var index = string.indexOf(char);
    if (index === -1)
      { throw new Error('CRDT: Malformed operation: ' + string); }
    var fragment = string.substring(0, index);
    string = string.substring(index + 1, string.length);
    return fragment;
  }
  this.type    = shift('$');
  this.id      = shift('#');
  this.version = parseInt(shift('@'), 32);
  this.time    = parseInt(shift('|'), 32);
  this.author  = shift('.');
  this.method  = shift(':');
  this.params  = string ? JSON.parse(string) : (string || '');
  this.originParams = this.params;
  return this;
};

// **Operation:localHash()** --
Operation.prototype.localHash = function () {
  return this.version.toString(32) +
    '@' + this.time.toString(32) +
    '|' + this.author +
    '.' + this.method;
};

// **Operation:toString()** --
Operation.prototype.toString = function () {
  var params = this.params || '';
  if (params) { params = JSON.stringify(this.params); }
  return this.type +
    '$' + this.id +
    '#' + this.version.toString(32) +
    '@' + this.time.toString(32) +
    '|' + this.author +
    '.' + this.method +
    ':' + params;
};
