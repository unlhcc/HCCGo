var app = angular.module('HccGoApp', ['HccGoApp.WelcomeCtrl', 
                              'ngRoute', 
                              'ConnectionServiceModule', 
                              'HccGoApp.clusterLandingCtrl', 
                              'PreferencesManager', 
                              'HccGoApp.clusterFileSystemCtrl',
                              'HccGoApp.jobSubmissionCtrl', 
                              'HccGoApp.jobHistoryCtrl', 
                              'filePathService',
                              'HccGoApp.NavCtrl']).config([
  '$routeProvider', function($routeProvider) {
    return $routeProvider.when('/', {
      templateUrl: 'html/welcome.html',
      controller: 'welcomeCtrl'
    }).when('/cluster/:clusterId', {
      templateUrl: 'html/clusterLanding.html',
      controller: 'clusterLandingCtrl'
    }).when('/cluster/:clusterId/filesystem', {
      templateUrl: 'html/clusterFileSystem.html',
      controller: 'clusterFileSystemCtrl'
    }).when('/cluster/:clusterId/jobSubmission', {
      templateUrl: 'html/jobSubmission.html',
      controller: 'jobSubmissionCtrl'
    }).when('/cluster/:clusterId/jobHistory', {
      templateUrl: 'html/jobHistory.html',
      controller: 'jobHistoryCtrl'
    }).otherwise({
      redirectTo: '/'
    });
  }
]);
