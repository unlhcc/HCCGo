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
      $scope.job = result;
    });
  });

  $scope.saveFile = function(fileType, $event) {
    const {dialog} = require('electron').remote;
    const fs = require('fs');
    var options = {
      filters: [
        { name: 'text', extensions: ['txt']}
      ]
    };

    dialog.showSaveDialog(options, function(localFile) {
      // If the user clicks cancel, localFile will be undefined
      if (!localFile) return;
      switch(fileType){
        case 'Output':
          if (!downloadRemoteFile($scope.job.outputPath, localFile))
            fs.writeFile(localFile, $scope.job.outText, function(err) {});
          break;
        case 'Error':
          if (!downloadRemoteFile($scope.job.errorPath, localFile))
            fs.writeFile(localFile, $scope.job.errText, function(err) {});
          break;
      }
    });
    // Stop the propagation of the click
    $event.stopPropagation();
  };

  function downloadRemoteFile(remotePath, localPath) {
    connectionService.getFileSize(remotePath).then(function(size) {
      if (size > 5*1025*1024) {
        connectionService.quickDownload(remotePath, localPath);
        return true;
      }
      return false;
    });
  }

  $scope.copyToClipboard = function(fileType) {
    const {clipboard} = require('electron');
    clipboard.writeText($scope.job[fileType]);
  }
}]);
