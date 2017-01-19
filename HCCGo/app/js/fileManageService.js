
fileManageService = angular.module('fileManageService', [])

fileManageService.factory('fileManageService',['$log', '$q', '$routeParams', 'connectionService', 'notifierService', 
   function($log, $q, $routeParams, connectionService, notifierService) {
  
   const async = require('async');
   const path = require('path');
   const fs = require('fs');
   const disk = require('diskusage');
 
   const _sourceDir = {name: ".."};

   let service = {};
   let _uploadStatus = false;
   let _boolUp = true;
   let _boolDown = false;
   let _processStatus = false;
   let _localFiles = [];
   let _remoteFiles = [];
   let _homeWD = new String("");
   let _workWD = new String("");
   let _localWD = new String("");
   let _remoteWD = new String("");
   let _remoteFocus = new String("");
   let _localFocus = new String("");
   let _processFinished = false;
   let _userDownAuth = false;
   let _userUpAuth = false;
   let _accuSize = 0;
   let _diskAvail = 0;
   let _diskQuota = 0;
   let _filesTotal = 0;
   let _counter = 0;
   let _totalProgress = 0;
   let _finalizer = false;

   /**
   * To handle state information for the file management
   *
   */

   // Return if upload/download process is finished
   service.getFinalizer = function(){
       return _finalizer;
   }

   service.getSourceDir = function(){
       return _sourceDir;
   }

   service.getTotalProgress = function(){
       return _totalProgress;
   }

   service.setTotalProgress = function(x){
       _totalProgress = x;
       return _totalProgress;
   }

   service.getCounter = function(){
       return _counter;
   }

   service.setCounter = function(x){
       _counter = x;
       return _counter;
   }

   service.getFilesTotal = function(){
       return _filesTotal;
   }

   service.setFilesTotal = function(x){
       _filesTotal = x;
       return _filesTotal;
   }

   service.getDiskQuota = function(){
       return _diskQuota;
   }

   service.setDiskQuota = function(x){
       _diskQuota = x;
       return _diskQuota;
   }

   service.getDiskAvail = function(){
       return _diskAvail;
   }

   service.setDiskAvail = function(x){
       _diskAvail = x;
       return _diskAvail;
   }

   service.getAccuSize = function(){
       return _accuSize;
   }

   service.setAccuSize = function(x){
       _accuSize = x;
       return _accuSize;
   }

   service.getUserDownAuth = function(){
       return _userDownAuth;
   }

   service.setUserDownAuth = function(x){
       _userDownAuth = x;
       return _userDownAuth;
   }

   service.getUserUpAuth = function(){
       return _userUpAuth;
   }

   service.setUserUpAuth = function(x){
       _userUpAuth = x;
       return _userUpAuth;
   }

   service.getProcessFinished = function(){
       return _processFinished;
   }

   service.setProcessFinished = function(x){
       _processFinished = x;
       return _processFinished;
   }

   service.getUploadStatus = function(){
       return _uploadStatus;
   }

   service.setUploadStatus = function(x){
       _uploadStatus = x;
       return _uploadStatus;
   }

   service.getBoolUp = function(){
       return _boolUp;
   }

   service.getBoolDown = function(){
       return _boolDown;
   }

   service.getProcessStatus = function(){
       return _processStatus;
   }

   service.setProcessStatus = function(x){
       _processStatus = x;
       return _processStatus;
   }

   service.getLocalFiles = function(){
       return _localFiles;
   }

   service.setLocalFiles = function(x){
       _localFiles = x;
       return _localFiles;
   }

   service.getRemoteFiles = function(){
       return _remoteFiles;
   }

   service.setRemoteFiles = function(x){
       _remoteFiles = x;
       return _remoteFiles;
   }

   service.getHomeWD = function(){
       return _homeWD;
   }

   service.setHomeWD = function(x){
       _homeWD = x;
       return _homeWD;
   }

   service.getWorkWD = function(){
       return _workWD;
   }

   service.setWorkWD = function(x){
       _workWD = x;
       return _workWD;
   }

   service.getLocalWD = function(){
       return _localWD;
   }

   service.setLocalWD = function(x){
       _localWD = x;
       return _localWD;
   }

   service.getRemoteWD = function(){
       return _remoteWD;
   }

   service.setRemoteWD = function(x){
       _remoteWD = x;
       return _remoteWD;
   }

   service.getRemoteFocus = function(){
       return _remoteFocus;
   }

   service.setRemoteFocus = function(x){
       _remoteFocus = x;
       return _remoteFocus;
   }

   service.getLocalFocus = function(){
       return _localFocus;
   }

   service.setLocalFocus = function(x){
       _localFocus = x;
       return _localFocus;
   }

   let remoteRead = function(data, finish){
       let _tempFiles = [];

       // REsets file directory listing
       connectionService.readDir(data).then(function (serverResponse) {
           // loops through each value returned by the server
           async.each(serverResponse, function(file, callback){
              $log.debug("Server Response: " + file.filename);
              if (file.longname.charAt(0) == 'd') {
                  _tempFiles.unshift({Class: "directory", name: file.filename});
              } else {
                  _tempFiles.push({Class: "ext_txt", name: file.filename});
              }

              // Indicates iteree is over
              callback(null);
           }, function(err) {
              if(err) {
                  $log.debug(err);
              } else {
                  _remoteFiles = _tempFiles;
              }

              finish();
           });
       });
   }

   let localRead = function(data, finish) {
      // Clears content of localFiles array
      _tempFiles = [];

      // Resets file directory listing
      fs.readdir(data, function(err, files) {
         async.each(files, function (file, callback) {
             fs.stat(String(_localWD + "/" + file), function (err, stats) {
                 if (err) {
                     callback(err);
                 } else if (stats.isDirectory()) {
                     _tempFiles.unshift({Class: "directory", name: file});
                 } else if (stats.isFile()) {
                     _tempFiles.push({Class: "ext_txt", name: file});
                 }
             });

             // Indicates code completion for this iteree
             callback(null);
         }, function(err) {
             if(err) {
                 $log.debug(err);
             } else {
                 _localFiles = _tempFiles;
             }

             finish();
         }); 
      });
   }

   service.wdSwitcher = function(){
       let deferred = $q.defer();
       let boolRet = false;
       boolRet = _remoteWD.indexOf(_workWD) > -1;
       
       _userDownAuth = false;
       _userUpAuth = false;

       if(boolRet) {
           _remoteWD = _homeWD;
       } else {
           _remoteWD = _workWD;
       }

       remoteRead(_remoteWD, function() {
           deferred.resolve(boolRet);
       });

       return deferred.promise;
   }

   service.cdSSH = function(data) {
       let deferred = $q.defer();

       if (data.name != "..") {
           _remoteWD = _remoteWD + "/" + data.name;
       } else {
           _remoteWD = path.dirname(_remoteWD);
       }

       remoteRead(_remoteWD, function() {
           deferred.resolve(null);
       });

       return deferred.promise;
   }

   service.cdLocal = function(data) {
       let deferred = $q.defer();

       if (data.name != "..") {
           _localWD = _localWD + "/" + data.name;
       } else {
           _localWD = path.dirname(_localWD);
       }

       localRead(_localWD, function() {
           deferred.resolve(null);
       });

       return deferred.promise;
   }
   
   service.verifyUpload = function () {
      let deferred = $q.defer();
      connectionService.localSize(String(_localWD + "/" + _localFocus)).then( function(ldata) {
          if (_remoteWD.indexOf(_workWD()) > -1) {
              connectionService.runCommand("lfs quota -g `id -g` /work").then(function(data) {
                  _processStatus = false;
                  _accuSize = ldata;

                  let reported_output = data.split("\n")[2];
                  let split_output = $.trim(reported_output).split(/[ ]+/);
                  _diskAvail = Math.floor(((split_output[3] - split_output[1]) / split_output[3])*100);
                  _diskQuota = Math.floor(((ldata / Math.pow(1024, 1)) / split_output[3])*100);
				  
				  deferred.resolve(null);
              });
          } else {
              connectionService.runCommand("quota -w -f /home").then(function(data) {
                  _processStatus = false;
                  _accuSize = ldata;

                  let reported_output = data.split("\n")[2];              
                  let split_output = reported_output.split(/[ ]+/);
                  _diskAvail = Math.floor(((split_output[2] - split_output[1]) / split_output[2])*100);
                  _diskQuota = Math.floor(((ldata / Math.pow(1024, 1)) / split_output[2])*100);
				  
				  deferred.resolve(null);
              });
          }
      });
	  
	  return deferred.promise;
   }

   service.verifyDownload = function () {
      let deferred = $q.defer();

      connectionService.runCommand("du -sb " + String(_remoteWD + "/" + _remoteFocus)).then(function (data) {
          _processStatus = false;
          let data_response = data.split(/[	]+/); //NOTE: Matches tab spaces
          _accuSize = data_response[0];
          disk.check(_localWD, function(err, info) {
              _diskQuota = Math.floor((data_response[0]/info.available)*100);
              _diskAvail = Math.floor((info.free/info.total)*100);
              deferred.resolve(null);
          });
      });

      return deferred.promise;
   }
   
   // Upload entire directory
   service.uploadCall = function(begun) {
      let deferred = $q.defer();
      let boolStarter = true;
	  
	  _finalizer = false;
      // Runs file upload
      connectionService.uploadFile(String(_localWD + "/" + _localFocus), String(_remoteWD + "/"), 
	   function(total_transferred,counter,filesTotal,currentTotal,sizeTotal){
	     // Only want this if to execute once
		 if(boolStarter) {
             _processStatus = false;
			 _uploadStatus = true;
			 _filesTotal = filesTotal;
			 boolStarter = false;
             begun();
		 }         

         _counter = counter;       

         _totalProgress = Math.floor(((total_transferred + currentTotal)/sizeTotal)*100);

       }, function() {
         // update view
         notifierService.success('Your file transfer was succesfull!', 'Transfer!');
		 _finalizer = true;
         _processFinished = true;
         remoteRead(_remoteWD, function() {
             deferred.resolve(null);
         });
       }, function(err) {
         // Error occurred in ConnectionService
		 notifierService.error(err, 'Error in ConnectionService');
		 _finalizer = true;
		 deferred.reject(err);
       });
	   
	   return deferred.promise;
   }

   service.downloadCall = function (begun) {
      let deferred = $q.defer();
      let boolStarter = true;

      _finalizer = false;
      // Runs file upload
      connectionService.downloadFile(String(_localWD + "/"), 
        String(_remoteWD + "/" + _remoteFocus),
        function(total_transferred,counter,filesTotal,currentTotal,sizeTotal){
         // Parity check
         if(boolStarter) {
             _processStatus = false;
             _uploadStatus = true;
             _filesTotal = filesTotal;
             boolStarter = false;
             begun();
         }

         // Callback function for progress bar
         _counter = counter;
         
         // Work on progress bar
         _totalProgress = Math.floor(((total_transferred + currentTotal)/sizeTotal)*100);
       }, function() {
         // update view
         notifierService.success('Your file transfer was succesfull!', 'Transfered!');
         _finalizer = true;
         _processFinished = true;   // Show finished message
         localRead(_localWD, function() {
             deferred.resolve(null);
         });
         
       }, function(err) {
         // Error occurred in ConnectionService
		 notifierService.error(err, 'Error in ConnectionService');
         _finalizer = true;
         deferred.reject(err);
       });

       return deferred.promise;
   } 

   // Value initialization
   //
   // Gets directory strings from remote server
   //
   if (_homeWD == "") {
       connectionService.getHomeWD().then(function(data) {
          _remoteWD = data;
          _homeWD = data;
          remoteRead(_remoteWD, function () {});    // Sets remote display
          $log.debug("Home directory: " + _homeWD);
       });
   }
   if (_workWD == "") {
       connectionService.getWorkWD().then(function(data) {
           _workWD = data;
           $log.debug("Work directory: " + _workWD);
       });
   }

   // Gets directory strings from local system
   if (process.platform === 'win32') {
       $log.debug("Process env: ");
       $log.debug(process.env);
       if (_localWD == "") {
          _localWD = process.env.HOMEDRIVE + process.env.HOMEPATH;
       }
   } else {
       // Runs for Mac and Linux systems
       // Establishes Displayed files
       $log.debug("process working directory: " + process.env.HOME);
       if (_localWD == "") {
           _localWD = process.env.HOME;
       }
   }

   localRead(_localWD, function() {
       _finalizer = true;
   });    // Sets local display

  
   return service;
  
}]);
