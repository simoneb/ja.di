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

    browsers: ['the_browser'],
    singleRun: true,

    sauceLabs: {
      username: process.env.SAUCE_USERNAME,
      accessKey: process.env.SAUCE_ACCESS_KEY,
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
      build: process.env.TRAVIS_BUILD_NUMBER,
      startConnect: true,
      testName: 'ja.di'
    },

    customLaunchers: {
      the_browser: {
        base: 'SauceLabs',
        browserName: process.env.JASMINE_BROWSER,
        platform: process.env.SAUCE_OS,
        version: process.env.SAUCE_BROWSER_VERSION
      }
    }
  });
};