'use strict';

module.exports = function (config) {
  require('./conf.js')(config);

  config.set({
    autoWatch: false,

    browsers: [
      'PhantomJS'
    ],

    singleRun: true
  });
};
