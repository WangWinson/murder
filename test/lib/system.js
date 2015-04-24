var MURDER = require('../../lib/index.js');

module.exports = MURDER;

MURDER.debug.enable('murder:*');

var events = require('events');

var debug = MURDER.debug;

var RelayStub = MURDER.Relay.adapt('RelayStub');

MURDER.RelayStub = RelayStub;

RelayStub.define('open', function (open) {
  return function () {
    return open.call(this, function () {
      this.remote = new events.EventEmitter();
      this.remote.on('message', function (event) {
        var rawOperation = event.data;
        debug.log(this.type + '.relay..on-message:', '', '\n', rawOperation);
        this.messageReceiver(rawOperation);
      }.bind(this));
      return this.emptyPromise();
    });
  };
});
