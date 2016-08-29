
clusterUploadModule = angular.module('HccGoApp.clusterFileSystemCtrl', ['ngRoute' ]);

clusterUploadModule.controller('clusterFileSystemCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', 'fileManageService', 
                                                         function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, notifierService, fileManageService) {

   // Initialization functions
   const disk = require('diskusage');
   const path = require("path");
   const fs = require("fs");
   const async = require("async");

   $scope.params = $routeParams
   var clusterInterface = null;
   $scope.sourceDir = {name: ".."};
   $scope.localFiles = fileManageService.getLocalFiles();
   $scope.remoteFiles = fileManageService.getRemoteFiles();

   // Sets default values on load
   $scope.onViewLoad = function () {
      $log.debug("ngView has changed");
      $scope.uploadStatus = fileManageService.getUploadStatus();
      $scope.boolUp = fileManageService.getBoolUp();
      $scope.boolDown = fileManageService.getBoolDown();
      $scope.processStatus = fileManageService.getProcessStatus();
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

      $scope.userDownAuth = fileManageService.setUserDownAuth(false);
      $scope.userUpAuth = fileManageService.setUserUpAuth(false);

      // Update view
      remoteRead($scope.remoteWD);
   }
   
   // Changes working directory from supplied list
   $scope.cdSSH = function (data) {
      if (data.name != "..") {
          $scope.remoteWD = fileManageService.setRemoteWD($scope.remoteWD + "/" + data.name);
      } else {
          $scope.remoteWD = fileManageService.setRemoteWD(path.dirname($scope.remoteWD));
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
      $scope.remoteFiles = fileManageService.setRemoteFiles([]);

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
             fileManageService.setRemoteFiles($scope.remoteFiles);
             if(err) $log.debug(err);
          });
       });
   }

   // Changes working directory for local system
   // Wrapper for local check
   $scope.cdLocal = function(data) {
      if (data.name != "..") {
          $scope.localWD = fileManageService.setLocalWD($scope.localWD + "/" + data.name);
      } else {
          $scope.localWD = fileManageService.setLocalWD(path.dirname($scope.localWD));
      }

      // Load display
      localRead($scope.localWD);

      // Hides upload button
      angular.element('#tranContent').text('');
      angular.element('#btnUpload').attr('disabled', '');
   }  
  
   var localRead = function(data) {
      // Clears content of localFiles array
      $scope.localFiles = fileManageService.setLocalFiles([]);

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
             fileManageService.setLocalFiles($scope.localFiles);
             $timeout(function() {
                 if(err) $log.debug(err);
             }, 300);
         }); 
      });
   }

   $scope.verifyUpload = function () {
      angular.element('#btnUpload').attr('disabled', '');
      $scope.userUpAuth = fileManageService.setUserUpAuth(true);
      $scope.processStatus = fileManageService.setProcessStatus(true);

      connectionService.localSize(String($scope.localWD + "/" + localFocus)).then( function(ldata) {
          if ($scope.remoteWD.indexOf(fileManageService.getWorkWD()) > -1) {
              connectionService.runCommand("lfs quota -g `id -g` /work").then(function(data) {
                  $scope.processStatus = fileManageService.setProcessStatus(false);
                  $scope.accuSize = fileManageService.setAccuSize(ldata);

                  reported_output = data.split("\n")[2];
                  split_output = $.trim(reported_output).split(/[ ]+/);
                  $scope.diskAvail = fileManageService.setDiskAvail(Math.floor(((split_output[3] - split_output[1]) / split_output[3])*100));
                  $scope.diskQuota = fileManageService.setDiskQuota(Math.floor(((ldata / Math.pow(1024, 1)) / split_output[3])*100));
              });
          } else {
              connectionService.runCommand("quota -w -f /home").then(function(data) {
                  $scope.processStatus = fileManageService.setProcessStatus(false);
                  $scope.accuSize = fileManageService.setAccuSize(ldata);

                  reported_output = data.split("\n")[2];              
                  split_output = reported_output.split(/[ ]+/);
                  $scope.diskAvail = fileManageService.setDiskAvail(Math.floor(((split_output[2] - split_output[1]) / split_output[2])*100));
                  $scope.diskQuota = fileManageService.setDiskQuota(Math.floor(((ldata / Math.pow(1024, 1)) / split_output[2])*100));
              });
          }
      });
   }

   $scope.verifyUploadCancel = function () {
      $scope.userUpAuth = fileManageService.setUserUpAuth(false);
      notifierService.warning('Action cancelled by user.');
   }

   // Upload entire directory
   $scope.uploadCall = function() {
      // Disable upload button to prevent double clicking
      $scope.processStatus = fileManageService.setProcessStatus(true);
      $scope.userUpAuth = fileManageService.setUserUpAuth(false);

      // Runs file upload
      connectionService.uploadFile(String($scope.localWD + "/" + localFocus), String($scope.remoteWD + "/"), function(total_transferred,counter,filesTotal,currentTotal,sizeTotal){
         // Callback function for progress bar
         //$log.debug("Total transferred: " + total_transferred);
         //$log.debug("Chunks: " + chunk);
         //$log.debug("Total: " + total);
         $scope.processStatus = fileManageService.setProcessStatus(false);
         
         $scope.filesTotal = filemanageService.setFilesTotal(filesTotal);
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
      $scope.userDownAuth = fileManageService.setUserDownAuth(true);
      $scope.processStatus = fileManageService.setProcessStatus(true);

      connectionService.runCommand("du -sb " + String($scope.remoteWD + "/" + remoteFocus)).then(function (data) {
          $scope.processStatus = false;
          var data_response = data.split(/[	]+/); //NOTE: Matches tab spaces
          $scope.accuSize = fileManageService.setAccuSize(data_response[0]);
          disk.check($scope.localWD, function(err, info) {
              $scope.diskQuota = fileManageService.setDiskQuota(Math.floor((data_response[0]/info.available)*100));
              $scope.diskAvail = fileManageService.setDiskAvail(Math.floor((info.free/info.total)*100));
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
   var remoteFocus = fileManageService.getRemoteFocus();    // Stores id of highlight object of remote origin
   var localFocus = fileManageService.getLocalFocus();     // Stores id of highlight object of local origin
   $scope.remoteHighlight = function(id) {
      angular.element("#btnDownload").removeAttr('disabled');       // Shows download button
      angular.element("#btnUpload").attr('disabled', '');           // Hides upload button
      angular.element("#l" +  localFocus.replace(/\./g, "\\.")).removeClass('highlight');
      localFocus = fileManageService.setLocalFocus("");
      angular.element("#r" + remoteFocus.replace(/\./g, "\\.")).removeClass('highlight');
      remoteFocus = fileManageService.setRemoteFocus(id.name);
      angular.element("#r" + id.name.replace(/\./g, "\\.")).addClass('highlight');

      // Change button context
      angular.element("#tranContent").text("Download: " + remoteFocus);

      // Sets all 'processing' displays to be hidden
      $scope.processStatus = fileManageService.setProcessStatus(false);
      $scope.uploadStatus = fileManageService.setUploadStatus(false);
      $scope.processFinished = fileManageService.setProcessFinished(false);
      $scope.userUpAuth = false;
      $scope.userDownAuth = false;
   }
   $scope.localHighlight = function(id) {
      angular.element("#btnDownload").attr('disabled', '');         // Hides download button
      angular.element("#btnUpload").removeAttr('disabled');         // Shows upload button
      angular.element("#r" + remoteFocus.replace(/\./g, "\\.")).removeClass('highlight');
      remoteFocus = "";
      angular.element("#l" + localFocus.replace(/\./g, "\\.")).removeClass('highlight');
      localFocus = id.name;
      angular.element("#l" + id.name.replace(/\./g, "\\.")).addClass('highlight');

      // Change button context
      angular.element("#tranContent").text("Upload: " + localFocus);

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
   if (fileManageService.getHomeWD() == "") {
       connectionService.getHomeWD().then(function(data) {
           $scope.remoteWD = fileManageService.setRemoteWD(data);
           fileManageService.setHomeWD(data);
           remoteRead($scope.remoteWD);    // Sets remote display
           $log.debug("Home directory: " + homeWD);
       });
   } else {
       $scope.remoteWD = fileManageService.getRemoteWD();
       remoteRead($scope.remoteWD);
   }
   if (fileManageService.getWorkWD() == "") {
       connectionService.getWorkWD().then(function(data) {
           fileManageService.setWorkWD(data);
           $log.debug("Work directory: " + workWD);
       });
   }

   // Gets directory strings from local system
   if (process.platform === 'win32') {
       $log.debug("Process env: ");
       $log.debug(process.env);
       if (fileManageService.getLocalWD == "") {
           $scope.localWD = fileManageService.setLocalWD(process.env.HOMEDRIVE + process.env.HOMEPATH);
       } else {
           $scope.localWD = fileManageService.getLocalWD();
       }
   } else {
       // Runs for Mac and Linux systems
       // Establishes Displayed files
       $log.debug("process working directory: " + process.env.HOME);
       if (fileManageService.getLocalWD == "") {
           $scope.localWD = fileManageService.setLocalWD(process.env.HOME);
       } else {
           $scope.localWD = fileManageService.getLocalWD();
       }
   }


   localRead($scope.localWD);    // Sets local display
 
}]);
