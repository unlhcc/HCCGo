
jobHistoryModule = angular.module('HccGoApp.jobHistoryCtrl', ['ngRoute' ]);

jobHistoryModule.controller('jobHistoryCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager) {

  $scope.params = $routeParams;

  // Get the username
  function getUsername() {

    connectionService.getUsername().then(function(username) {
      $scope.username = username;
    });

  }
  getUsername();

  $scope.logout = function() {

    $location.path("/");

  }

  // load json file
  $.getJSON('data/jobHistory.json', function(json) {
    $scope.jobs = json.jobs;
  });


}]);
