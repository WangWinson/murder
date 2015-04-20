require('../../example/public/bind.js');
require('es6-shim');

global.WebSocket = global.WebSocket || (global.WebSocket = function () {});
