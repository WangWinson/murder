'use strict';

module.exports = function(config) {
  config.set({
    autoWatch: false,

    basePath: __dirname + '/../',

    browserify: {
      debug: true
    },

    browserNoActivityTimeout: 10000,

    browsers: [
      'Chrome',
      // 'Firefox'
      // 'PhantomJS'
      // 'Safari'
    ],

    client: {
      mocha: {
        reporter: 'html',
        ui: 'bdd'
      }
    },

    colors: true,

    files: [
      'test/**/*spec.js'
    ],

    frameworks: ['browserify', 'mocha'],

    preprocessors: {
      'test/**/*spec.js': ['browserify']
    },

    reporters: ['progress'],

    singleRun: true
  });
};
