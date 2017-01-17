
clusterUploadModule = angular.module('HccGoApp.clusterFileSystemCtrl', ['ngRoute' ]);

clusterUploadModule.controller('clusterFileSystemCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', 'fileManageService', 
                                                         function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, notifierService, fileManageService) {

   // Initialization functions
   const path = require("path");
   const fs = require("fs");
   const async = require("async");

   $scope.params = $routeParams
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
      fileManageService.verifyUpload().then(function(val) {
		  $scope.userUpAuth = fileManageService.getUserUpAuth();
		  $scope.processStatus = fileManageService.getProcessStatus();
		  $scope.accuSize = fileManageService.getAccuSize();
		  $scope.diskAvail = fileManageService.getDiskAvail();
		  $scope.diskQuota = fileManageService.getDiskQuota();
      });
   }

   $scope.verifyUploadCancel = function () {
      $scope.userUpAuth = fileManageService.setUserUpAuth(false);
      notifierService.warning('Action cancelled by user.');
   }

   let progressCal = function() {
     async.until(function(){
       return fileManageService.getFinalizer();
	 },function(done){
	   $scope.$apply(function(scope) {
	     scope.filesTotal = fileManageService.getFilesTotal();
	     scope.counter = fileManageService.getCounter();
	     scope.totalProgress = fileManageService.getTotalProgress();
	   });
	   done(); // Loop finished
	 },function(err){
       if(err) {
           notifierService.error(err, 'Issue gathering progress data');
       }
	 });
   }
   
   // Upload entire directory
   $scope.uploadCall = function() {
      // Disable upload button to prevent double clicking
      $scope.processStatus = fileManageService.setProcessStatus(true);
      $scope.userUpAuth = fileManageService.setUserUpAuth(false);

      // Runs file upload
	  fileManageService.uploadCall(function(){
          progressCal();
	      $scope.processStatus = fileManageService.getProcessStatus();
	  }).then(function(val) {
	      $scope.processStatus = fileManageService.getProcessStatus();
	  });
   }

   $scope.verifyDownload = function () {
      angular.element('#btnDownload').attr('disabled', '');
      $scope.userDownAuth = fileManageService.setUserDownAuth(true);
      $scope.processStatus = fileManageService.setProcessStatus(true);

      fileManageService.verifyDownload().then(function(val) {
          $scope.processStatus = fileManageService.setProcessStatus(false);
          $scope.accuSize = fileManageService.getAccuSize();
          $scope.diskQuota = fileManageService.getDiskQuota();
          $scope.diskAvail = fileManageService.getDiskAvail();
      });
   }

   $scope.verifyDownloadCancel = function () {
      $scope.userDownAuth = fileManageService.setUserDownAuth(false);
      notifierService.warning('Action cancelled by user.');
   }

   $scope.downloadCall = function () {
      $scope.processStatus = fileManageService.setProcessStatus(true);
      $scope.userDownAuth = fileManageService.setUserDownAuth(false);

      fileManageService.downloadCall(function(){
          progressCal();
          $scope.processStatus = fileManageService.getProcessStatus();
      }).then(function(val) {
          $scope.processStatus = fileManageService.getProcessStatus();
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
