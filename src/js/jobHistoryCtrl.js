
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
  var jsonFile
  $.getJSON(filePath, function(json) {
    $scope.jobs = json.jobs;
    jsonFile = json;
  });

  $scope.deleteJob = function(job) {
    bootbox.confirm({
      message: "Are you sure you want to delete this job?",
      callback: function(result) {
        if(result) {
          // remove panel
          $("#panel"+job.id).fadeOut(500, function() {
            $(this).css({"visibility":"hidden",display:'block'}).slideUp();
          });
          // remove from angular binding and reset ids
          $scope.jobs.splice(job.id,1);
          for (var i = 0; i < $scope.jobs.length; i++) {
            $scope.jobs[i].id = i;
          }
          // remove entry from json file
          var fs = require("fs");
          jsonFile.jobs = $scope.jobs;
          fs.writeFile(filePath, JSON.stringify(jsonFile, null, 2), function(err) {
            if(err) {
              return console.error(err);
            }
            else {
              console.log("Job successfully deleted.");
            }
          });
        }
      }
    });
  }


}]);
