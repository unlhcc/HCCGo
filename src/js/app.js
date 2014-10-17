


var app = angular.module('HccGoApp', ['HccGoApp.WelcomeCtrl', 'ngRoute']).config([
  '$routeProvider', function($routeProvider) {
    return $routeProvider.when('/', {
      templateUrl: 'html/welcome.html',
      controller: 'welcomeCtrl'
    }).otherwise({
      redirectTo: '/'
    });
  }
]);
