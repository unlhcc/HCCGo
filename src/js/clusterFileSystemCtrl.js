
clusterUploadModule = angular.module('HccGoApp.clusterFileSystemCtrl', ['ngRoute' ]);

clusterUploadModule.controller('clusterFileSystemCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager) {
  
   // Sets default values on load
   $scope.onViewLoad = function () {
      $log.debug("ngView has changed");
      $scope.progressVisible = false;
      $scope.uploadStatus = false;
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
          }, function(err) {
             $log.debug(err);
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
         }, function(err) {
             if (err) {
                 $log.debug(err);
             }
         }); 
      });
   }

   // Upload entire directory
   $scope.uploadCall = function() {
      // Establishes access to object
      var file = $scope.files[0];

      // Runs file upload
      connectionService.uploadFile(String(file.path), "./", function(total_transferred,chunk,total){
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
   
   // highlight selection and store id
   var remoteFocus = new String("");    // Stores id of highlight object of remote origin
   var localFocus = new String("");     // Stores id of highlight object of local origin
   $scope.remoteHighlight = function(id) {
      if (localFocus != "") {
          angular.element("#" + localFocus.replace(/\./g, "\\.")).removeClass('highlight');
          localFocus = "";
      }
      angular.element("#" + remoteFocus.replace(/\./g, "\\.")).removeClass('highlight');
      remoteFocus = id.name;
      angular.element("#" + id.name.replace(/\./g, "\\.")).addClass('highlight');
   }
   $scope.localHighlight = function(id) {
      if (remoteFocus != "") {
          angular.element("#" + remoteFocus.replace(/\./g, "\\.")).removeClass('highlight');
          remoteFocus = "";
      }
      angular.element("#" + localFocus.replace(/\./g, "\\.")).removeClass('highlight');
      localFocus = id.name;
      angular.element("#" + id.name.replace(/\./g, "\\.")).addClass('highlight');
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

   // Initialization functions
   $scope.params = $routeParams
   var clusterInterface = null;
   var path = require("path");
   var fs = require("fs");
   var async = require("async");
   $scope.sourceDir = {name: ".."};

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
   } else {
       // Runs for Mac and Linux systems
       // Establishes Displayed files
       $log.debug("process working directory: " + process.env.home);
       $scope.localWD = process.env.HOME;
       localRead($scope.localWD);    // Sets local display
   }
 
}]);
