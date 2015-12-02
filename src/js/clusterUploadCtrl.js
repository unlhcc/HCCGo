
clusterUploadModule = angular.module('HccGoApp.clusterUploadCtrl', ['ngRoute' ]);

clusterUploadModule.controller('clusterUploadCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager) {
  
   $scope.params = $routeParams
   var clusterInterface = null;
   
   // Sets initial values
   var wd = {wdClass: "active", name: "Home", path: "."};
   $scope.wdList = [];
   $scope.clusterFolder = [];
   $scope.wdList.push(wd);
   connectionService.readDir(".").then(function (serverResponse) {
      // loops through each value returned by the server
      var tempHolder = {wdClass: "", name: ""};
      for (var x = 0; x < serverResponse.length; x++) {
         $log.debug("Server Response: " + serverResponse[x].filename);
         if (serverResponse[x].longname.charAt(0) == 'd') {
            tempHolder = {wdClass: "directory", name: serverResponse[x].filename};
            $scope.clusterFolder.push(tempHolder);
         } 

      }
   });
 
   // Sets default values on load
   $scope.onViewLoad = function () {
      $log.debug("ngView has changed");
      $scope.progressVisible = false;
      $scope.uploadStatus = false;
   }
   
   // Changes working directory for file upload wd
   $scope.cdSSHWD = function (data) {
      $log.debug($scope.wdList);
      if (data.name != $scope.wdList[$scope.wdList.length - 1].name) {
         var directoryIndex = 1;      // Sets index of array where working directory exists
         // loops through array finding wanted previous folder
         for (var x = 0; x < $scope.wdList.length; x++) {
            if ($scope.wdList[x].name == data.name) {
               directoryIndex = x;
            }
         }
         
         // Sets working directory to desired path
         $log.debug("wdList before slice");
         $log.debug($scope.wdList);
         $scope.wdList = $scope.wdList.slice(0,directoryIndex + 1);
         $scope.wdList[$scope.wdList.length - 1].wdClass = "active";
         $log.debug("wdList after slice");
         $log.debug($scope.wdList);
      
         // Resets file listing display
         
         resetFileDisplay();
      } else {
         $log.debug("Current working directory");
      }
      $log.debug($scope.wdList);
   }
   
   // Changes working directory from supplied list
   $scope.cdSSH = function (data) {
      // Establishes object to push into wdList
      var newWD = {wdClass: "active", name: data.name, path: "/" + data.name + "/"};
      
      // Changes wdClass of last object in array
      $scope.wdList[$scope.wdList.length -1].wdClass = "";
      
      // Pushes new directory in wdList
      $scope.wdList.push(newWD);
      
      // Resets file directory listing
      resetFileDisplay();
   }  
  
   // Sets the name of the file to upload in the declaration box
   $scope.setFiles = function(element) {
      $scope.$apply(function(scope) {
         $log.debug('File set: ' + element.files);
         $log.debug('Number of files: ' + element.files.length);
         $scope.files = [];
         for (var i = 0; i < element.files.length; i++) {
            $scope.files.push(element.files[i]);
         }
         $scope.progressValue = 0;
      })
   }
   
   var resetFileDisplay = function() {
      // Resets file listing display
      $log.debug("resetFileDisplay has been called");
      var filePath = ".";
      $scope.clusterFolder = [];
      for(var x = 1; x < $scope.wdList.length; x++) {
         filePath += $scope.wdList[x].path;
      }
      $log.debug($scope.wdList);
      $log.debug(filePath);
      connectionService.readDir(filePath).then(function (serverResponse) {
         // loops through each value returned by the server
         var tempHolder = {wdClass: "", name: ""};
         for (var x = 0; x < serverResponse.length; x++) {
            $log.debug("Server Response: " + serverResponse[x].filename);
            if (serverResponse[x].longname.charAt(0) == 'd') {
               tempHolder = {wdClass: "directory", name: serverResponse[x].filename};
               $scope.clusterFolder.push(tempHolder);
            } 
         }
      });

   }

   var uploadCall = function(local, remote) {
      // Runs file upload
      connectionService.uploadFile(local, remote, function(total_transferred,chunk,total){
         // Callback function for progress bar
         $log.debug("Total transferred: " + total_transferred);
         $log.debug("Chunks: " + chunk);
         $log.debug("Total: " + total);
         
         // Work on progress bar
         $scope.$apply(function(scope) {
            $scope.progressVisible = true;
            $scope.uploadStatus = false;
            $scope.max = total;
            $scope.progressValue = Math.floor((total_transferred/total)*100);
            $scope.progressVisible = true;
            $log.debug("Progress: " + ((total_transferred/total)*100) + "%");
            
            if($scope.progressValue == 100) {
               $scope.progressVisible = false;
               $scope.uploadStatus = true;
            }
         });
         
         });
   }

   // Uploads files through SFTPStream
   $scope.uploadFile = function() {

      // Let's do some debugging
      var index = 0;
      var file = $scope.files[index];
      console.log("Value of file.name: " + file.name);
      console.log("Value of file.path: " + file.path);

      // Pulls active working directory
      var filePath = "";
      for(var x = 0; x < $scope.wdList.length; x++) {
         filePath += ($scope.wdList[x].path + '/');
      }
      
      uploadCall(file.path,filePath + file.name); 
      resetFileDisplay();
   }
   
   // Upload entire directory
   $scope.uploadDirectory = function() {
      // Establishes access to object
      var file = $scope.files[0];
      var activeDir = { path: file.path,
                     webkitRelativePath: file.webkitRelativePath};
      
      // Cuts the 'excess' portion off the relative path
      for (var x = 0; x >= 0; x++) {
         if (activeDir.webkitRelativePath.indexOf('/') != -1) {
            activeDir.webkitRelativePath = activeDir.webkitRelativePath.slice(
               activeDir.webkitRelativePath.indexOf('/') + 1, 
               activeDir.webkitRelativePath.length
               );
         } else {
            x = -100;
         }
      }
      
      var fileDir = getFiles(activeDir);
      $log.debug("fileDir length: " + fileDir.length);
      // Loops through and uploads files
      //var holdPath = [];            // Holds queue of local file paths to upload
      //var holdwebkitPath = [];      // Holds queue of remote locations to upload too
      for (var z = 0; z < fileDir.length; z++) {
         $log.debug("fileDir value");
         $log.debug(fileDir);
         $log.debug("fileDir.path: " + fileDir[z].path);
         $log.debug("fileDir.webkitRelativePath: " + fileDir[z].webkitRelativePath);
         //holdPath.push(String(fileDir[z].path));
         //holdwebkitPath.push("./" + String(fileDir[z].webkitRelativePath));
         //uploadCall(holdPath.pop(), holdwebkitPath.pop());
         uploadCall(String(fileDir[z].path),"./" + String(fileDir[z].webkitRelativePath));
      }
         // Resets file display
         resetFileDisplay();
   }
   
   // pulling all files from a directory
   var getFiles = function(dir, files_){
      var fs = require('fs');
      files_ = files_ || [];
      var files = fs.readdirSync(dir.path);
      $log.debug("getFiles dir: ");
      $log.debug(dir);
      $log.debug("getFiles files: ");
      $log.debug(files);
      $log.debug("getFiles files count: " + files.length);
      for (var x = 0; x < files.length; x++) {
       (function () {
         var name = {path: dir.path + '/' + files[x],
               webkitRelativePath: dir.webkitRelativePath + '/' + files[x]};
         $log.debug("CLUSTERUPLOAD :: NAME :: VALUE :: ITERATION " + x);
         $log.debug(name);
       
         if (fs.statSync(name.path).isDirectory()){
            connectionService.makeDir(getWD() + '/' + name.webkitRelativePath);
            files_ = getFiles(name, files_);
         } else {
            files_.push(name);
         }
       }());
      }
      return files_;
   }
   
   // get current active directory
   var getWD = function() {
      var path = "";
      
      for (var x = 0; x < $scope.wdList.length; x++) {
         path += $scope.wdList[x].path;
      }
      $log.debug("Current working directory: " + path);
      return path;
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
   angular.element("#btnDirectory").on('click', function() {
      angular.element("#btnDirectory").removeClass('active');
      angular.element("#btnDirectory").addClass('active');
      angular.element("#btnFile").removeClass('active');
   });
   
   angular.element("#btnFile").on('click', function() {
      angular.element("#btnDirectory").removeClass('active');
      angular.element("#btnFile").removeClass('active');
      angular.element("#btnFile").addClass('active');
      angular.element("#btnFile").addClass('active');
   });
  
  
}]);
