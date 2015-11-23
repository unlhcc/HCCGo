var app = angular.module('HccGoApp', ['HccGoApp.WelcomeCtrl', 
                              'ngRoute', 
                              'ConnectionServiceModule', 
                              'HccGoApp.clusterLandingCtrl', 
                              'PreferencesManager',
                              'HccGoApp.clusterDownloadCtrl',
                              'HccGoApp.clusterUploadCtrl',
                              'HccGoApp.NavCtrl']).config([
  '$routeProvider', function($routeProvider) {
    return $routeProvider.when('/', {
      templateUrl: 'html/welcome.html',
      controller: 'welcomeCtrl'
    }).when('/cluster/:clusterId', {
      templateUrl: 'html/clusterLanding.html',
      controller: 'clusterLandingCtrl'
    }).when('/cluster/:clusterId/upload', {
      templateUrl: 'html/clusterFileUpload.html',
      controller: 'clusterUploadCtrl'
   }).when('/cluster/:clusterId/download', {
      templateUrl: 'html/clusterFileDownload.html',
      controller: 'clusterDownloadCtrl'
   }).otherwise({
      redirectTo: '/'
    });
  }
]);
