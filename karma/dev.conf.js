'use strict';

module.exports = function (config) {
  require('./conf.js')(config);

  config.set({
    autoWatch: true,

    browsers: [
      'Chrome',
      // 'Firefox',
      'PhantomJS'
      // 'Safari'
    ],

    singleRun: false
  });
};
