// # STOMP Relay
// [lib/index.js](../index.html) > lib/relays/StompRelay.js
'use strict';

var stomp = require('stomp');

var StompRelay = require('../core/Relay.js').adapt('StompRelay');

module.exports = StompRelay;

// TODO: finish implementation.
