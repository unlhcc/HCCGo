jobViewModule = angular.module('HccGoApp.jobViewCtrl', ['ngRoute' ]);

jobViewModule.controller('jobViewCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', 'jobService', 'dbService', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, notifierService, jobService, dbService) {

  $scope.params = $routeParams;

  // query the db for the specific job and check if out/err is loaded
  dbService.getSubmittedJobsDB().then(function(db) {
    db.find({_id: $routeParams.jobId}, function (err, docs) {
      var result = docs[0];
      if (err) {
        $log.error("Error querying the DB for job states");
      }
      else if (result.hasOwnProperty("outText") && result.hasOwnProperty("errText")) {
        $scope.$apply(function() {
          $scope.job = result;
        });
      }
      else {
        // In parallel, get the size of the output and error
        connectionService.getFileSize(result.outputPath).then(function(size) {
          // If the file is larger than 5MB
          if(size > 5*1025*1024) {
            result.outText = "The Output file is too large to be displayed here."
          } else {
            connectionService.getFileText(result.outputPath).then(function(data) {
              var text = data.length>0 ? data : "(none)";
              result.outText = text;
              db.update(
                { _id: $routeParams.jobId },
                { $set:
                  {
                  "outText": text
                  }
                },
                { returnUpdatedDocs: true },
                function (err, numReplaced, affectedDocuments) {
                  // update db with data so it doesn't have to be queried again
                  if (err) {
                    $log.debug("Something went wrong updating the db.");
                  }
                }
              );
            });
          }
        });

        connectionService.getFileSize(result.errorPath).then(function(size) {
          if(size > 5*1025*1024) {
            result.errText = "The Error file is too large to be displayed here."
          }
          connectionService.getFileText(result.errorPath).then(function(data) {
            var text = data.length>0 ? data : "(none)";
            result.errText = text;
            // Only save the output if the job is marked complete
            if (result.complete) {
              db.update(
                { _id: $routeParams.jobId },
                { $set:
                  {
                  "errText": text
                  }
                },
                { returnUpdatedDocs: true },
                function (err, numReplaced, affectedDocuments) {
                  // update db with data so it doesn't have to be queried again
                  if (err) {
                    $log.debug("Something went wrong updating the db.");
                  }
                }
              );
            }
          });
        });
      }
      $scope.$apply(function() {
        $scope.job = result;
      });
    });
  });

}]);
