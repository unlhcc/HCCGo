
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

  $scope.cancel = function() {
    $location.path("cluster/" + $scope.params.clusterId);
  }

  $scope.loadDefault = function() {

    $location.path("cluster/" + $scope.params.clusterId + "/jobSubmission");

  }

  $scope.loadJob = function(job) {

    $location.path("cluster/" + $scope.params.clusterId + "/jobSubmission");

  }

  // load json file
  $.getJSON('data/jobHistory.json', function(json) {
    $scope.jobs = json.jobs;
  });


}]);
