// # React Mixin
// [lib/index.js](../index.html) > lib/extras/ReactMixin.js
'use strict';

var CRDT = require('../core/ConflictFreeReplicatedDataType.js'),
    debug = require('../debug.js');

function setCRDTState(component, crdt) {
  component.setState(crdt.state);
}

module.exports = {
  getDefaultProps: function () {
    return {
      crdtName: 'CRDT',
      crdtId: null,
      crdt: null
    };
  },

  getInitialState: function () {
    this.getCRDT();
    return {};
  },

  getCRDT: function () {
    if (!this.props.crdt && this.props.crdtName) {
      var Type = CRDT.getType(this.props.crdtName);
      this.props.crdt = new Type(this.props.crdtId);
    }
  },

  linkCRDT: function () {
    if (this.operationListener) { return; }
    var crdt = this.props.crdt,
        operationDelay;
    this.operationListener = function (operation, origin) {
      debug.error('React CRDT operation:', this, operation, origin);
      clearTimeout(operationDelay);
      operationDelay = setTimeout(function () {
        if (this.setCRDTState) { this.setCRDTState(crdt); }
        else { setCRDTState(this, crdt); }
      }.bind(this), 100);
    }.bind(this);
    crdt.on('operation', this.operationListener);
  },

  operationListener: null,

  componentWillMount: function () {
    // this.linkCRDT();
    setCRDTState(this, this.props.crdt);
    this.linkCRDT();
  },

  componentDidMount: function () {
    var crdt = this.props.crdt;
    // crdt.sync();
    crdt.syncOnce();
  },

  componentWillUnmount: function () {
    var crdt = this.props.crdt;
    crdt.removeListener('operation', this.operationListener);
  }
};
