jobViewModule = angular.module('HccGoApp.jobViewCtrl', ['ngRoute' ]);

/**
 * This controller is responsible for displaying the input, output, and error of a specific job.
 * The user is able to copy the output and error of a job up to 5MB.
 * They are also able to save the entire file to their local machines.
 * 
 * @ngdoc controller
 * @memberof HCCGo
 * @class jobViewCtrl
 * @requires $scope
 * @requires $log
 * @requires $timeout
 * @requires connectionService
 * @requires $routeParams
 * @requires $location
 * @requires $q
 * @requires preferencesManager
 * @requires notifierService
 * @requires jobService
 * @requires dbService
 */
jobViewModule.controller('jobViewCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', 'jobService', 'dbService', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, notifierService, jobService, dbService) {

  $scope.params = $routeParams;

  // query the db for the specific job and check if out/err is loaded
  dbService.getSubmittedJobsDB().then(function(db) {
    var outDownload = true;
    var errDownload = true;
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
            result.outText = "The Output file is too large to be displayed here.";
            outDownload = false;
          } else {
            connectionService.getFileText(result.outputPath).then(function(data) {
              var text = data.length>0 ? data : "(none)";
              result.outText = text;
              outDownload = text != "(none)";
              db.update(
                { _id: $routeParams.jobId },
                { $set:
                  {
                  "outText": text,
                  "outDownload": outDownload
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
            result.errText = "The Error file is too large to be displayed here.";
            errDownload = false;
          }
          else {
            connectionService.getFileText(result.errorPath).then(function(data) {
            var text = data.length>0 ? data : "(none)";
            result.errText = text;
            errDownload = result.errText != "(none)";
            // Only save the output if the job is marked complete
            if (result.complete) {
              db.update(
                { _id: $routeParams.jobId },
                { $set:
                  {
                  "errText": text,
                  "errDownload": errDownload
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
                result.errDownload = errDownload;
                result.outDownload = outDownload;
              }
            });
          }
        });
      }
      $scope.$apply(function() {
          $scope.job = result;
      });
    });
  });

  /**
   * Saves the output or error to a file
   * @method saveFile
   * @memberof HCCGo.jobViewCtrl
   * @param {String} fileType - Denotes either the output or error to be Saved
   * @param {Event} $event - Used to stop the save event from moving up the DOM
   */
  $scope.saveFile = function(fileType, $event) {
    const {dialog} = require('electron').remote;
    const fs = require('fs');
    const path = require('path');

    var options = {
      filters: [
        { name: 'text', extensions: ['txt']}
      ]
    };

    dialog.showSaveDialog(options, function(localFile) {
      // If the user clicks cancel, localFile will be undefined
      if (!localFile) return;

      downloadRemoteFile($scope.job[fileType], localFile).then(function(flag) {
        if (!flag) {
          fs.writeFile(localFile, $scope.job[fileType], function(err) {});
        }
        notifierService.success(path.basename(localFile).trim() + " was Successfully Saved!", "Save Successful!");
      },
      function(err) {
        notifierService.error(msg);
      });
      
    });
    // Stop the propagation of the click
    $event.stopPropagation();
  };

  /**
   * Used to download the file requested from the server, since only 5MB worth of data is displayed to the user.
   * @method downloadRemoteFile
   * @memberof HCCGo.jobViewCtrl
   * @param {String} remotePath - Denotes the path on the server to download the file from
   * @param {String} localPath - Denotes the path where the user wants the file saved
   * @returns {Promise} A promise denoting whether the file was downloaded from the server or not.
   */
  function downloadRemoteFile(remotePath, localPath) {
    var deferred = $q.defer();

    connectionService.getFileSize(remotePath).then(function(size) {
      if (size > 5*1025*1024) {
        connectionService.quickDownload(remotePath, localPath).then(function(flag) {
          deferred.resolve(true);
        }, 
        function(err) {
            deferred.reject("Error downloading file!");  
        });
      }
      else {
        deferred.resolve(false);
      }
      $log.log(deferred);
    });
    return deferred.promise;
  }

  /**
   * Copies the contents of the displayed output or error to the system clipboard
   * @method copyToClipboard
   * @memberof HCCGo.jobViewCtrl
   * @param {String} fileType - Used to grab either output or error from the textarea
   * @param {Object} $event - Stops the copy event from traversing up the DOM
   */
  $scope.copyToClipboard = function(fileType, $event) {
    const {clipboard} = require('electron');
    clipboard.writeText($scope.job[fileType]);
    $event.stopPropagation();
    notifierService.success("Copied to Clipboard!", "Copied!");
  }
}]);
