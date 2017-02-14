
clusterUploadModule = angular.module('HccGoApp.clusterFileSystemCtrl', ['ngRoute' ]);

clusterUploadModule.controller('clusterFileSystemCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', 
                                                         function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, notifierService) {

   // Initialization functions
   var disk = require('diskusage');
   $scope.params = $routeParams
   var clusterInterface = null;
   var path = require("path");
   var fs = require("fs");
   var async = require("async");
   $scope.sourceDir = {name: ".."};
   $scope.localFiles = [];
   $scope.remoteFiles = [];

   // Sets default values on load
   $scope.onViewLoad = function () {
      $log.debug("ngView has changed");
      $scope.uploadStatus = false;
      $scope.boolUp = true;
      $scope.boolDown = false;
      $scope.processStatus = true;
   }

   $scope.wdSwitcher = function(dir) {
      if(dir.indexOf(workWD) > -1) {
          $scope.remoteWD = homeWD;
          angular.element('#lblSwitch').text('Work');
          angular.element('#lblRemote').text('Home');
      } else {
          $scope.remoteWD = workWD;
          angular.element('#lblSwitch').text('Home');
          angular.element('#lblRemote').text('Work');
      }

      $scope.userDownAuth = false;
      $scope.userUpAuth = false;

      // Update view
      remoteRead($scope.remoteWD);
   }
   
   // Changes working directory from supplied list
   $scope.cdSSH = function (data) {
      if (data.name != "..") {
          $scope.remoteWD = $scope.remoteWD + "/" + data.name;
      } else {
          $scope.remoteWD = path.dirname($scope.remoteWD);
      }

      // loads view
      remoteRead($scope.remoteWD);

      // Hides download button
      angular.element('#btnDownload').attr('disabled', '');
      angular.element('#tranContent').text('');
   }

   // Load Remote view
   var remoteRead = function(data) {
      // Clears content of remoteFiles array
      $scope.remoteFiles = [];

      // Resets file directory listing
      connectionService.readDir(data).then(function (serverResponse) {
          // loops through each value returned by the server
          async.each(serverResponse, function(file, callback){
             $log.debug("Server Response: " + file.filename);
             if (file.longname.charAt(0) == 'd') {
                $scope.remoteFiles.unshift({Class: "directory", name: file.filename});
             } else {
                $scope.remoteFiles.push({Class: "ext_txt", name: file.filename});
             }
 
             // Indicates iteree is over
             callback(null); 
          }, function(err) {
             if(err) $log.debug(err);
          });
       });
   }

   // Changes working directory for local system
   // Wrapper for local check
   $scope.cdLocal = function(data) {
      if (data.name != "..") {
          $scope.localWD = $scope.localWD + "/" + data.name;
      } else {
          $scope.localWD = path.dirname($scope.localWD);
      }

      // Load display
      localRead($scope.localWD);

      // Hides upload button
      angular.element('#tranContent').text('');
      angular.element('#btnUpload').attr('disabled', '');
   }  
  
   var localRead = function(data) {
      // Clears content of localFiles array
      $scope.localFiles = [];

      // Resets file directory listing
      fs.readdir(data, function(err, files) {
         async.each(files, function (file, callback) {
             fs.stat(String($scope.localWD + "/" + file), function (err, stats) {
                 if (err) {
                     callback(err);
                 } else if (stats.isDirectory()) {
                     $scope.localFiles.unshift({Class: "directory", name: file});
                 } else if (stats.isFile()) {
                     $scope.localFiles.push({Class: "ext_txt", name: file});
                 }
             });

             // Indicates code completion for this iteree
             callback(null);
         }, function(err) {
             $timeout(function() {
                 if(err) $log.debug(err);
             }, 300);
         }); 
      });
   }

   $scope.verifyUpload = function () {
      angular.element('#btnUpload').attr('disabled', '');
      $scope.userUpAuth = true;
      $scope.processStatus = true;

      connectionService.localSize(String($scope.localWD + "/" + localFocus)).then( function(ldata) {
          if ($scope.remoteWD.indexOf(workWD) > -1) {
              connectionService.runCommand("lfs quota -g `id -g` /work").then(function(data) {
                  $scope.processStatus = false;
                  $scope.accuSize = ldata;

                  reported_output = data.split("\n")[2];
                  split_output = $.trim(reported_output).split(/[ ]+/);
                  $scope.diskAvail = Math.floor(((split_output[3] - split_output[1]) / split_output[3])*100);
                  $scope.diskQuota = Math.floor(((ldata / Math.pow(1024, 1)) / split_output[3])*100);
              });
          } else {
              connectionService.runCommand("quota -w -f /home").then(function(data) {
                  $scope.processStatus = false;
                  $scope.accuSize = ldata;

                  reported_output = data.split("\n")[2];              
                  split_output = reported_output.split(/[ ]+/);
                  $scope.diskAvail = Math.floor(((split_output[2] - split_output[1]) / split_output[2])*100);
                  $scope.diskQuota = Math.floor(((ldata / Math.pow(1024, 1)) / split_output[2])*100);
              });
          }
      });
   }

   $scope.verifyUploadCancel = function () {
      $scope.userUpAuth = false;
      notifierService.warning('Action cancelled by user.');
   }

   // Upload entire directory
   $scope.uploadCall = function() {
      // Disable upload button to prevent double clicking
      $scope.processStatus = true;
      $scope.userUpAuth = false;

      // Runs file upload
      connectionService.uploadFile(String($scope.localWD + "/" + localFocus), String($scope.remoteWD + "/"), function(total_transferred,counter,filesTotal,currentTotal,sizeTotal){
         // Callback function for progress bar
         //$log.debug("Total transferred: " + total_transferred);
         //$log.debug("Chunks: " + chunk);
         //$log.debug("Total: " + total);
         $scope.processStatus = false;
         
         $scope.filesTotal = filesTotal;
         $scope.counter = counter;
         
         // Work on progress bar
         $scope.$apply(function(scope) {
            scope.uploadStatus = true;
            scope.totalProgress = Math.floor(((total_transferred + currentTotal)/sizeTotal)*100);
         });
       }, function() {
         // update view
         notifierService.success('Your file transfer was succesfully!', 'Files Transfer!');
         $scope.processFinished = true;
         remoteRead($scope.remoteWD);
         
       }, function(err) {
         // Error occured in ConnectionService
       });
   }

   $scope.verifyDownload = function () {
      angular.element('#btnDownload').attr('disabled', '');
      $scope.userDownAuth = true;
      $scope.processStatus = true;

      connectionService.runCommand("du -sb " + String($scope.remoteWD + "/" + remoteFocus)).then(function (data) {
          $scope.processStatus = false;
          var data_response = data.split(/[	]+/); //NOTE: Matches tab spaces
          $scope.accuSize = data_response[0];
          disk.check($scope.localWD, function(err, info) {
              $scope.diskQuota = Math.floor((data_response[0]/info.available)*100);
              $scope.diskAvail = Math.floor((info.free/info.total)*100);
          });
      });
   }

   $scope.verifyDownloadCancel = function () {
      $scope.userDownAuth = false;
      notifierService.warning('Action cancelled by user.');
   }

   $scope.downloadCall = function () {
      $scope.processStatus = true;
      $scope.userDownAuth = false;

      // Runs file upload
      connectionService.downloadFile(String($scope.localWD + "/"), 
        String($scope.remoteWD + "/" + remoteFocus),
        function(total_transferred,counter,filesTotal,currentTotal,sizeTotal){
         // Callback function for progress bar
         //$log.debug("Total transferred: " + total_transferred);
         //$log.debug("Chunks: " + chunk);
         //$log.debug("Total: " + total);
         $scope.processStatus = false;     // Rotating processing indicator no longer needed

         $scope.filesTotal = filesTotal;
         $scope.counter = counter;
         
         // Work on progress bar
         $scope.$apply(function(scope) {
            scope.uploadStatus = true;
            //scope.max = total;
            scope.totalProgress = Math.floor(((total_transferred + currentTotal)/sizeTotal)*100);
            //scope.progressValue = Math.floor((total_transferred/total)*100);
            //$log.debug("Progress: " + ((total_transferred/total)*100) + "%");
         });
       }, function() {
         // update view
         notifierService.success('Your file transfer was succesfull!', 'File(s) Transfered!');
         $scope.processFinished = true;   // Show finished message
         localRead($scope.localWD);
         
       }, function(err) {
         // Error occured in ConnectionService
       });
   } 
   
   // highlight selection and store id
   var remoteFocus = new String("");    // Stores id of highlight object of remote origin
   var localFocus = new String("");     // Stores id of highlight object of local origin
   $scope.remoteHighlight = function(id) {
      $scope.localOverwrite = false;

      angular.element("#btnDownload").removeAttr('disabled');       // Shows download button
      angular.element("#btnUpload").attr('disabled', '');           // Hides upload button
      angular.element("#l" +  localFocus.replace(/\./g, "\\.")).removeClass('highlight');
      localFocus = "";
      angular.element("#r" + remoteFocus.replace(/\./g, "\\.")).removeClass('highlight');
      remoteFocus = id.name;
      angular.element("#r" + id.name.replace(/\./g, "\\.")).addClass('highlight');

      // Change button context
      angular.element("#tranContent").text("Download: " + remoteFocus);

      // Alert if same file on local system
      for(let dirObj of $scope.localFiles) {
        if(id.name === dirObj.name) {
          $scope.localOverwrite = true; 
        }
      }

      // Sets all 'processing' displays to be hidden
      $scope.processStatus = false;
      $scope.uploadStatus = false;
      $scope.processFinished = false;
      $scope.userUpAuth = false;
      $scope.userDownAuth = false;
   }
   $scope.localHighlight = function(id) {
      $scope.remoteOverwrite = false;

      angular.element("#clusterWarning").attr('display', 'none');
      angular.element("#btnDownload").attr('disabled', '');         // Hides download button
      angular.element("#btnUpload").removeAttr('disabled');         // Shows upload button
      angular.element("#r" + remoteFocus.replace(/\./g, "\\.")).removeClass('highlight');
      remoteFocus = "";
      angular.element("#l" + localFocus.replace(/\./g, "\\.")).removeClass('highlight');
      localFocus = id.name;
      angular.element("#l" + id.name.replace(/\./g, "\\.")).addClass('highlight');

      // Change button context
      angular.element("#tranContent").text("Upload: " + localFocus);

      // Alert if local file is on the cluster
      for(let dirObj of $scope.remoteFiles) {
        if(id.name === dirObj.name) {
          $scope.remoteOverwrite = true; 
        }
      }

      // Sets all 'processing' displays to be hidden
      $scope.processStatus = false;
      $scope.uploadStatus = false;
      $scope.processFinished = false;
      $scope.userUpAuth = false;
      $scope.userDownAuth = false;
   }

   preferencesManager.getClusters().then(function(clusters) {
   // Get the cluster type
   var clusterType = $.grep(clusters, function(e) {return e.label == $scope.params.clusterId})[0].type;

   switch (clusterType) {
     case "slurm":
      clusterInterface = new SlurmClusterInterface(connectionService, $q);
      break;
     case "condor":
      clusterInterface = new CondorClusterInterface(connectionService, $q);
      break;
   }

   });
   
   // jQuery controls
  /* 
   angular.element('input[type=radio][name=radUp]').change(function() {
       if(this.value == 'file') {
           angular.element("#fileToUpload").removeAttr('directory');
           angular.element("#fileToUpload").removeAttr('webkitdirectory');
           angular.element("#headFile").text("File to upload");
           $log.debug("radio is file");
       } else if (this.value == 'folder') {
           angular.element("#fileToUpload").attr('directory', '');
           angular.element("#fileToUpload").attr('webkitdirectory', '');
           angular.element("#headFile").text("Folder to upload");
           $log.debug("radio is folder");
       }
   });
*/
   // Gets directory strings from remote server
   var homeWD, workWD;
   connectionService.getHomeWD().then(function(data) {
       $scope.remoteWD = data;
       homeWD = data;
       remoteRead($scope.remoteWD);    // Sets remote display
       $log.debug("Home directory: " + homeWD);
   });
   connectionService.getWorkWD().then(function(data) {
       workWD = data;
       $log.debug("Work directory: " + workWD);
   });

   // Gets directory strings from local system
   if (process.platform === 'win32') {
       // TODO: Get working directory on windows machines
       $log.debug("Process env: ");
       $log.debug(process.env);
       $scope.localWD = process.env.HOMEDRIVE + process.env.HOMEPATH;
       $log.debug(process);
       $log.debug("localWD = " + $scope.localWD);
       localRead($scope.localWD);
   } else {
       // Runs for Mac and Linux systems
       // Establishes Displayed files
       $log.debug("process working directory: " + process.env.HOME);
       $scope.localWD = process.env.HOME;
       $log.debug(process);
       localRead($scope.localWD);    // Sets local display
   }
 
}]);
