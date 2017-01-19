jobViewModule = angular.module('HccGoApp.jobViewCtrl', ['ngRoute' ]);

jobViewModule.controller('jobViewCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', 'jobService', 'dbService', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, notifierService, jobService, dbService) {

  $scope.params = $routeParams;

  db = dbService.getSubmittedJobsDB();

  // query the db for the specific job and check if out/err is loaded
  db.find({_id: $routeParams.jobId}, function (err, docs) {
    var result = docs[0];
    if (err) {
      $log.err("Error querying the DB for job states");
    }
    else if (result.hasOwnProperty("outText") && result.hasOwnProperty("errText")) {
      $scope.job = result;
    }
    else {
      // In parallel, get the size of the output and error
      connectionService.getFileSize(result.outputPath).then(function(size) {
        // If the file is larger than 5MB
        if(size > 5*1025*1024) {
          result.outText = "The Output file is too large to be displayed here."
        } else {
          connectionService.getFileText(result.outputPath).then(function(data) {
            result.outText = data.length>0 ? data : "(none)";
          });
        }

      });

      connectionService.getFileSize(result.errorPath).then(function(size) {
        if(size > 5*1025*1024) {
          result.errText = "The Error file is too large to be displayed here."
        }
        connectionService.getFileText(result.errorPath).then(function(data) {
          result.errText = data.length>0 ? data : "(none)";
        });
      });
      $scope.job = result;
    }
  });

}]);
