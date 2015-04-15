// # Author ID
// [lib/index.js](index.html) > example/author.js
'use strict';

// For this example we only need one `uuid`. Only the last 12 digits are used.
var uuid = require('../lib/index.js').uuid.v4().split('-').pop();

// A prefix is added to the `uuid` to indicate whether it is from the client or server.
module.exports = function (isServer) {
  return (isServer ? 'S-' : 'C-') + uuid;
};
