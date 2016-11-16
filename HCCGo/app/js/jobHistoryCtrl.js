
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

}).controller('jobHistoryCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'jobService', 'dbService', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, jobService, dbService) {

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

  // query db
  const DataStore = require('nedb');
  var jobHistoryDB = dbService.getJobHistoryDB();
  // Get completed jobs from db file
  jobHistoryDB.find({}, function (err, docs) {
    // if data already loaded, just add them to the list
    $scope.jobs = docs;
    if(err) console.log("Error fetching completed jobs: " + err);
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
          // remove from angular binding
          $scope.jobs.splice(index,1);
          db.remove({ _id: job._id }, { multi: true }, function (err, numRemoved) {
            if(err) console.log("Error deleting document " + err);
          });
        }
      }
    });
  }


}]);
