
jobHistoryModule = angular.module('HccGoApp.jobHistoryCtrl', ['ngRoute' ]);

jobHistoryModule.service('jobService', function() {

  var job = null;

  return {
    getJob: function() {
      var temp = job;
      job = null;
      return temp;
    },
    setJob: function(value) {
      job = value;
    }
  };

}).controller('jobHistoryCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'jobService', 'filePathService', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, jobService, filePathService) {

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

    jobService.setJob(job);
    $location.path("cluster/" + $scope.params.clusterId + "/jobSubmission");

  }

  // load json file
  var filePath = filePathService.getFilePath();
  $.getJSON(filePath, function(json) {
    $scope.jobs = json.jobs;
  });


}]);
