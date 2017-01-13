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
      connectionService.getFileSize(result.outputPath + ' ' + result.errorPath).then(function(data) {
        if(parseInt(data[result.outputPath].replace("kB","")) > 5000) {
          result.outText = "The output file is too large to be displayed here."
        }
        else {
          connectionService.getFileText(result.outputPath).then(function(data) {
            result.outText = data;
          });
        }
        if(parseInt(data[result.errorPath].replace("kB","")) > 5000) {
          result.errText = "The error file is too large to be displayed here."
        }
        else {
          connectionService.getFileText(result.errorPath).then(function(data) {
            result.errText = data.length>0 ? data : "(none)";
          });
        }
        $scope.job = result;
      });
    }
  });

}]);
