
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
   $scope.sourceDir = fileManageService.getSourceDir();

   $scope.wdSwitcher = function(dir) {
      fileManageService.wdSwitcher(dir).then(function(val) {
          if(val) {
              angular.element('#lblSwitch').text('Work');
              angular.element('#lblRemote').text('Home');
          } else {
              angular.element('#lblSwitch').text('Home');
              angular.element('#lblRemote').text('Work');
          }

          $scope.userDownAuth = fileManageService.getUserDownAuth();
          $scope.userUpAuth = fileManageService.getUserUpAuth();
          $scope.remoteWD = fileManageService.getRemoteWD();
          // Update view
          $scope.remoteFiles = fileManageService.getRemoteFiles();
      });
   }
   
   // Changes working directory from supplied list
   $scope.cdSSH = function (data) {
      fileManageService.cdSSH(data).then(function(val) {
          $scope.remoteWD = fileManageService.getRemoteWD();

          // Hides download button
          angular.element('#btnDownload').attr('disabled', '');
          angular.element('#tranContent').text('');
      });
   }

   // Changes working directory for local system
   // Wrapper for local check
   $scope.cdLocal = function(data) {
      fileManageService.cdLocal(data).then(function(val) {
          $scope.localWD = fileManageService.getLocalWD();

          // Hides upload button
          angular.element('#tranContent').text('');
          angular.element('#btnUpload').attr('disabled', '');
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
         $scope.processStatus = fileManageService.setProcessStatus(false);
         
         $scope.filesTotal = fileManageService.setFilesTotal(filesTotal);
         $scope.counter = fileManageService.setCounter(counter);
         
         $scope.$apply(function(scope) {
            scope.uploadStatus = fileManageService.setUploadStatus(true);
            scope.totalProgress = fileManageService.setTotalProgress(Math.floor(((total_transferred + currentTotal)/sizeTotal)*100));
         });
       }, function() {
         // update view
         notifierService.success('Your file transfer was succesfully!', 'Files Transfer!');
         $scope.processFinished = fileManageService.setProcessFinished(true);
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
      $scope.userDownAuth = fileManageService.setUserDownAuth(false);
      notifierService.warning('Action cancelled by user.');
   }

   $scope.downloadCall = function () {
      $scope.processStatus = fileManageService.setProcessStatus(true);
      $scope.userDownAuth = fileManageService.setUserDownAuth(false);

      // Runs file upload
      connectionService.downloadFile(String($scope.localWD + "/"), 
        String($scope.remoteWD + "/" + remoteFocus),
        function(total_transferred,counter,filesTotal,currentTotal,sizeTotal){
         // Callback function for progress bar
         //$log.debug("Total transferred: " + total_transferred);
         //$log.debug("Chunks: " + chunk);
         //$log.debug("Total: " + total);
         $scope.processStatus = fileManageService.setProcessStatus(false);     // Rotating processing indicator no longer needed

         $scope.filesTotal = fileManageService.setFilesTotal(filesTotal);
         $scope.counter = fileManageService.setCounter(counter);
         
         // Work on progress bar
         $scope.$apply(function(scope) {
            scope.uploadStatus = fileManageService.setUploadStatus(true);
            //scope.max = total;
            scope.totalProgress = fileManageService.setTotalProgress(Math.floor(((total_transferred + currentTotal)/sizeTotal)*100));
            //scope.progressValue = Math.floor((total_transferred/total)*100);
            //$log.debug("Progress: " + ((total_transferred/total)*100) + "%");
         });
       }, function() {
         // update view
         notifierService.success('Your file transfer was succesfull!', 'File(s) Transfered!');
         $scope.processFinished = fileManageService.setProcessFinished(true);   // Show finished message
         localRead($scope.localWD);
         
       }, function(err) {
         // Error occured in ConnectionService
       });
   } 
   
   // highlight selection and store id
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
      $scope.userUpAuth = fileManageService.setUserUpAuth(false);
      $scope.userDownAuth = fileManageService.setUserDownAuth(false);
   }
   $scope.localHighlight = function(id) {
      angular.element("#btnDownload").attr('disabled', '');         // Hides download button
      angular.element("#btnUpload").removeAttr('disabled');         // Shows upload button
      angular.element("#r" + remoteFocus.replace(/\./g, "\\.")).removeClass('highlight');
      remoteFocus = fileManageService.setRemoteFocus("");
      angular.element("#l" + localFocus.replace(/\./g, "\\.")).removeClass('highlight');
      localFocus = fileManageService.setLocalFocus(id.name);
      angular.element("#l" + id.name.replace(/\./g, "\\.")).addClass('highlight');

      // Change button context
      angular.element("#tranContent").text("Upload: " + localFocus);

      // Sets all 'processing' displays to be hidden
      $scope.processStatus = fileManageService.setProcessStatus(false);
      $scope.uploadStatus = fileManageService.setUploadStatus(false);
      $scope.processFinished = fileManageService.setProcessFinished(false);
      $scope.userUpAuth = fileManageService.setUserUpAuth(false);
      $scope.userDownAuth = fileManageService.setUserDownAuth(false);
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
   // Initialize variables
   let remoteFocus = fileManageService.getRemoteFocus();    // Stores id of highlight object of remote origin
   let localFocus = fileManageService.getLocalFocus();     // Stores id of highlight object of local origin
   let homeWD, workWD;
   $scope.uploadStatus = fileManageService.getUploadStatus();
   $scope.boolUp = fileManageService.getBoolUp();
   $scope.boolDown = fileManageService.getBoolDown();
   $scope.processStatus = fileManageService.getProcessStatus();
   $scope.accuSize = fileManageService.getAccuSize();
   $scope.diskAvail = fileManageService.getDiskAvail();
   $scope.diskQuota = fileManageService.getDiskQuota();
   $scope.filesTotal = fileManageService.getFilesTotal();
   $scope.counter = fileManageService.getCounter();
   $scope.totalProgress = fileManageService.getTotalProgress();
   $scope.userDownAuth = fileManageService.getUserDownAuth();
   $scope.userUpAuth = fileManageService.getUserDownAuth();
   $scope.remoteFiles = fileManageService.getRemoteFiles();
   $scope.localFiles = fileManageService.getLocalFiles();

   if (localFocus != "") {
      angular.element("#l" + localFocus.replace(/\./g, "\\.")).addClass('highlight');
   } else if (remoteFocus != "") {
      angular.element("#r" + remoteFocus.replace(/\./g, "\\.")).addClass('highlight');
   }

}]);
