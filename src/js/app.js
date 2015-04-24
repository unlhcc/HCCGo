


var app = angular.module('HccGoApp', ['HccGoApp.WelcomeCtrl', 'ngRoute', 'ConnectionServiceModule']).config([
  '$routeProvider', function($routeProvider) {
    return $routeProvider.when('/', {
      templateUrl: 'html/welcome.html',
      controller: 'welcomeCtrl'
    }).otherwise({
      redirectTo: '/'
    });
  }
]);
