


var app = angular.module('HccGoApp', ['HccGoApp.WelcomeCtrl', 'ngRoute', 'ConnectionServiceModule', 'HccGoApp.clusterLandingCtrl', 'PreferencesManager']).config([
  '$routeProvider', function($routeProvider) {
    return $routeProvider.when('/', {
      templateUrl: 'html/welcome.html',
      controller: 'welcomeCtrl'
    }).when('/cluster/:clusterId', {
      templateUrl: 'html/clusterLanding.html',
      controller: 'clusterLandingCtrl'
    }).otherwise({
      redirectTo: '/'
    });
  }
]);
