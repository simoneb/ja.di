module.exports = function(config) {
  config.set({
    basePath: '..',
    frameworks: ['jasmine'],
    files: [
      'node_modules/lodash/lodash.js',
      'ja.di.js',
      'spec/*.js'
    ],
    reporters: ['progress'],
    port: 9876,
    colors: true,
    autoWatch: true,
    browsers: ['Chrome', 'PhantomJS'],
    singleRun: true
  });
};