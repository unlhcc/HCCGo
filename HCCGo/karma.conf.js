// Karma configuration
// Generated on Fri Feb 10 2017 16:23:15 GMT-0600 (CST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      '../node_modules/angular/angular.js',                             // angular
      '../node_modules/angular-route/angular-route.js', // ui-router
      '../node_modules/angular-mocks/angular-mocks.js',                 // loads our modules for tests
      './app/lib/angular-toastr/angular-toastr.tpls.js',
      './node_modules/async/dist/async.js',
      
      // Mocks
      '../test/mocks/*.js',
      
      // Application files
      './app/js/filePathService.js',
      './app/js/PreferencesManager.js',
      './app/js/updaterService.js',
      './app/js/ConnectionService.js',
      './app/js/NotifierService.js',
      './app/js/navService.js',
      './app/js/analytics.js',
      './app/js/app.js',
      './app/js/dataUsageService.js'
      // Specs
      '../test/specs/*.js'

    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '**/*.js': ['electron']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Electron'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,
    
    // DEV: `useIframe: false` is for launching a new window instead of using an iframe 
    //   In Electron, iframes don't get `nodeIntegration` priveleges yet windows do 

    client: {
      useIframe: false,
    }
    
  })
}
