
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

  $scope.loadJob = function(job, clone) {
    job.clone = clone;
    jobService.setJob(job);
    $location.path("cluster/" + $scope.params.clusterId + "/jobSubmission");

  }

  // Get completed jobs from db file
  dbService.getJobHistoryDB().then(function(jobHistoryDB) {
    jobHistoryDB.find({}, function (err, docs) {
      // if data already loaded, just add them to the list
      $scope.jobs = docs;
      if(err) console.log("Error fetching completed jobs: " + err);
    });
  });

  $scope.deleteJob = function(job) {
    bootbox.confirm({
      message: "Are you sure you want to delete this job?",
      callback: function(result) {
        if(result) {
          // remove panel
          $("#panel"+job._id).fadeOut(500, function() {
            $(this).css({"visibility":"hidden",display:'block'}).slideUp();
          });
          // remove from angular binding
          for(var i=0; i<$scope.jobs.length; i++) {
            if($scope.jobs[i]._id == job._id) {
              $scope.jobs.splice(i,1);
            }
          }
          dbService.getJobHistoryDB().then(function(db) {
            db.remove({ _id: job._id }, { multi: true }, function (err, numRemoved) {
              if(err) $log.error("Error deleting document " + err);
            });
          });
        }
      }
    });
  }


}]);
