var isPhantomJS =
  typeof window !== 'undefined' &&
  /PhantomJS/.test(window.navigator.userAgent);

if (isPhantomJS) {
  require('../../example/public/bind.js');
  require('es6-shim');

  window.WebSocket = function WebSocket() {};
}
