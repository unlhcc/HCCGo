
fileManageService = angular.module('fileManageService', [])

fileManageService.factory('fileManageService',['$log', '$q', '$routeParams', 'connectionService', 'notifierService', '$timeout',
   function($log, $q, $routeParams, connectionService, notifierService, $timeout) {
  
   const async = require('async');
   const path = require('path');
   const fs = require('fs');
   const disk = require('diskusage');
   const tmp = require('tmp');
   const {shell} = require('electron');
   
   let service = {};

   /**
   * To handle state information for the file management
   *
   */

   // Return if upload/download process is finished
   service.sourceDir = {name: ".."};

   service.totalProgress = 0;

   service.counter = 0;

   service.filesTotal = 0;

   service.diskQuota = 0;

   service.diskAvail = 0;

   service.accuSize = 0;

   service.userDownAuth = false;

   service.userUpAuth = false;

   service.processFinished = false;

   service.uploadStatus = false;

   service.boolUp = true;

   service.boolDown = false;

   service.processStatus = false;

   service.remoteOverwrite = false;

   service.localOverwrite = false;

   service.canDownload = false;

   service.canUpload = false;

   service.canView = false;

   service.viewing = false;

   service.localFiles = [];

   service.remoteFiles = [];

   service.homeWD = new String("");

   service.workWD = new String("");

   service.localWD = new String("");

   service.remoteWD = new String("");

   service.remoteFocus = new String("");

   service.localFocus = new String("");
   
   service.lblRemote = "Home";
   
   service.lblSwitch = "Work";

   service.focus = {};
   
   
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
                  _tempFiles.push({Class: "ext_txt", name: file.filename, location: data + "/" + file.filename, size: file.attrs.size ,mtime: new Date(1e3 * file.attrs.mtime)});
              }

              // Indicates iteree is over
              callback(null);
           }, function(err) {
              if(err) {
                  $log.debug(err);
              } else {
                  service.remoteFiles = _tempFiles;
              }
           });
       });
   };

   let localRead = function(data, finish) {
      // Clears content of localFiles array
	  let _tempFiles = [];

      // Resets file directory listing
      fs.readdir(data, function(err, files) {
         async.each(files, function (file, callback) {
             $log.debug("Local Response: " + file);
             fs.stat(String(service.localWD + "/" + file), function (err, stats) {
                 if (err) {
                     callback(err);
                 } else if (stats.isDirectory()) {
                     _tempFiles.unshift({Class: "directory", name: file});
                 } else if (stats.isFile()) {
                     _tempFiles.push({Class: "ext_txt", name: file, location: data + "/" + file, size: stats.size, mtime: stats.mtime});
                 }
             });

             // Indicates code completion for this iteree
             callback(null);
         }, function(err) {
             if(err) {
                 $log.debug(err);
             } else {
                 $timeout(function() {
				     service.localFiles = _tempFiles;
				 }, 100);
             }
         }); 
      });
   };

   service.wdSwitcher = function(){       
       service.userDownAuth = false;
       service.userUpAuth = false;

       if(service.remoteWD.indexOf(service.workWD) > -1) {
           service.remoteWD = service.homeWD;
		   service.lblSwitch = "Work";
		   service.lblRemote = "Home";
       } else {
           service.remoteWD = service.workWD;
		   service.lblSwitch = "Home";
		   service.lblRemote = "Work";
       }

       remoteRead(service.remoteWD);
	   
	   return 0;
   };

   service.cdSSH = function(data) {
       if (data.name != "..") {
           service.remoteWD = service.remoteWD + "/" + data.name;
       } else {
           service.remoteWD = path.dirname(service.remoteWD);
       }

	   // Hides download button
       service.canDownload = false;
       angular.element('#tranContent').text('');
	   
       remoteRead(service.remoteWD);
	   
	   return 0;
   };

   service.cdLocal = function(data) {
       if (data.name != "..") {
           service.localWD = service.localWD + "/" + data.name;
       } else {
           service.localWD = path.dirname(service.localWD);
       }

       // Hides upload button
       service.canUpload = false;
       angular.element('#tranContent').text('');
	   
       localRead(service.localWD);
   };
   
   service.verifyUpload = function () {

       service.canUpload = false;
       service.userUpAuth = true;
       service.processStatus = true;

       connectionService.localSize(String(service.localWD + "/" + service.localFocus)).then( function(ldata) {
           if (service.remoteWD.indexOf(service.workWD) > -1) {
               connectionService.runCommand("lfs quota -g `id -g` /work").then(function(data) {
                   service.processStatus = false;
                   service.accuSize = ldata;

                   let reported_output = data.split("\n")[2];
                   let split_output = $.trim(reported_output).split(/[ ]+/);
                   service.diskAvail = Math.floor(((split_output[3] - split_output[1]) / split_output[3])*100);
                   service.diskQuota = Math.floor(((ldata / Math.pow(1024, 1)) / split_output[3])*100);

                });
            } 
            else {
                connectionService.runCommand("quota -w -f /home").then(function(data) {
                    service.processStatus = false;
                    service.accuSize = ldata;

                    let reported_output = data.split("\n")[2];              
                    let split_output = reported_output.split(/[ ]+/);
                    service.diskAvail = Math.floor(((split_output[2] - split_output[1]) / split_output[2])*100);
                    service.diskQuota = Math.floor(((ldata / Math.pow(1024, 1)) / split_output[2])*100);
                });
            }
        });
    };
   
   service.verifyUploadCancel = function() {
	  service.userUpAuth = false;
      notifierService.warning('Action cancelled by user.');
   };

   service.verifyDownload = function () {
       service.canDownload = false;
       service.userDownAuth = true;
       service.processStatus = true;
       
       connectionService.runCommand("du -sb " + String(service.remoteWD + "/" + service.remoteFocus)).then(function (data) {
           service.processStatus = false;
           let data_response = data.split(/[	]+/); //NOTE: Matches tab spaces
           service.accuSize = data_response[0];
           disk.check(service.localWD, function(err, info) {
               service.diskQuota = Math.floor((data_response[0]/info.available)*100);
               service.diskAvail = Math.floor((info.free/info.total)*100);
            });
        });
    };
    
    service.verifyDownloadCancel = function () {
        service.userDownAuth = false;
        notifierService.warning('Action cancelled by user.');
    };
   
   service.viewFile = function() {
        service.viewing = true;
        tmp.setGracefulCleanup();
        connectionService.getFileSize(service.focus.location).then(function(size){
            if (size > 5*1024*1024) {
                notifierService.warning("File must be downloaded to be viewed.", "File too big to view!");
                service.viewing = false;
            }
            else {
                let file = "/" + service.focus.location.substring(service.focus.location.lastIndexOf("/"), service.focus.location.length);
                tmp.dir({prefix: 'hcc_tmp', unsafeCleanup: true}, function _tempDirCreated(err, path, cleanupCallback) {
                    connectionService.quickDownload(service.focus.location, path + file).then(function(flag) {
                        if (flag) {
                            service.viewing = false;
                            shell.openItem(path + file);
                        }
                        else {
                            notifierService.error("Error viewing the file!", "File View Failed!");
                            service.viewing = false;
                        }
                    });
                });
            }
        
        });
    };

    // Upload entire directory
    service.uploadCall = function() {
        let boolStarter = true;
        service.processStatus = true;
        service.userUpAuth = false;

        // Runs file upload
        connectionService.uploadFile(String(service.localWD + "/" + service.localFocus), String(service.remoteWD + "/"), 
        function(total_transferred,counter,filesTotal,currentTotal,sizeTotal){
            // Only want this if to execute once
            if(boolStarter) {
                service.uploadStatus = true;
                service.filesTotal = filesTotal;
                boolStarter = false;
            }

            $timeout(function() {
                service.counter = counter;
                service.totalProgress = Math.floor(((total_transferred + currentTotal)/sizeTotal)*100);
            }, 15);
        }, function() {
            // update view
            notifierService.success('Your file transfer was succesfull!', 'Transfer!');
            service.processStatus = false;
            service.processFinished = true;
            remoteRead(service.remoteWD);
        }, function(err) {
            // Error occurred in ConnectionService
            service.processStatus = false;
            notifierService.error(err, 'Error in ConnectionService');
        });
    };

    service.downloadCall = function () {
        let boolStarter = true;
        service.processStatus = true;
        service.userDownAuth = false;
        // Runs file upload
        connectionService.downloadFile(String(service.localWD + "/"),
        String(service.remoteWD + "/" + service.remoteFocus),
        function(total_transferred,counter,filesTotal,currentTotal,sizeTotal){
            // Parity check
            if(boolStarter) {
                service.uploadStatus = true;
                service.filesTotal = filesTotal;
                boolStarter = false;
            }

            $timeout(function() {
                // Callback function for progress bar
                service.counter = counter;
                
                // Work on progress bar
                service.totalProgress = Math.floor(((total_transferred + currentTotal)/sizeTotal)*100);
            }, 15);
        }, function() {
            // update view
            localRead(service.localWD);
            service.processStatus = false;
            notifierService.success('Your file transfer was succesfull!', 'Transfered!');
            service.processFinished = true;   // Show finished message         
        }, function(err) {
            // Error occurred in ConnectionService
            service.processStatus = false;
            notifierService.error(err, 'Error in ConnectionService');
        });
    };
    service.remoteHighlight = function(id) {
        service.remoteOverwrite = false;
        service.localOverwrite = false;
        service.focus.location = id.location;
        service.focus.size = id.size;
        service.focus.mtime = id.mtime;

        for(let dirObj of service.localFiles) {
            if(id.name === dirObj.name) {
                service.localOverwrite = true; 
            }
        }
        service.canDownload = true;                           // Enables download button
        service.canView = id.Class !== 'directory';           // Enables view button if file is not a directory
        service.canUpload = false;                            // Disables upload button

        angular.element("#l" + service.localFocus.replace(/\./g, "\\.")).removeClass('highlight');
        service.localFocus = "";
        angular.element("#r" + service.remoteFocus.replace(/\./g, "\\.")).removeClass('highlight');
        service.remoteFocus = id.name;
        angular.element("#r" + id.name.replace(/\./g, "\\.")).addClass('highlight');
        
        // Change button context
        angular.element("#tranContent").text("Download: " + service.remoteFocus);
        
        // Sets all 'processing' displays to be hidden
        service.processStatus = false;
        service.uploadStatus = false;
        service.processFinished = false;
        service.userUpAuth = false;
        service.userDownAuth = false;
    };
    
    service.localHighlight = function(id) {
        service.localOverwrite = false;
        service.remoteOverwrite = false;
        service.focus.location = id.location;
        service.focus.size = id.size;
        service.focus.mtime = id.mtime;
        
        for(let dirObj of service.remoteFiles) {
            if(id.name === dirObj.name) {
                service.remoteOverwrite = true; 
            }
        }

        service.canDownload = false;      // Disables download button
        service.canView = false;          // Disables view button
        service.canUpload = true;         // Enables upload button
        
        angular.element("#r" + service.remoteFocus.replace(/\./g, "\\.")).removeClass('highlight');
        service.remoteFocus = "";
        angular.element("#l" + service.localFocus.replace(/\./g, "\\.")).removeClass('highlight');
        service.localFocus = id.name;
        angular.element("#l" + id.name.replace(/\./g, "\\.")).addClass('highlight');
        
        // Change button context
        angular.element("#tranContent").text("Upload: " + service.localFocus);
        
        // Sets all 'processing' displays to be hidden
        service.processStatus = false;
        service.uploadStatus = false;
        service.processFinished = false;
        service.userUpAuth = false;
        service.userDownAuth = false;
    };

    // Value initialization
    //
    // Gets directory strings from remote server
    //
    if (service.homeWD == "") {
        connectionService.getHomeWD().then(function(data) {
            service.remoteWD = data;
            service.homeWD = data;
            remoteRead(service.remoteWD);    // Sets remote display
            $log.debug("Home directory: " + service.homeWD);
        });
    }
    if (service.workWD == "") {
        connectionService.getWorkWD().then(function(data) {
            service.workWD = data;
            $log.debug("Work directory: " + service.workWD);
        });
    }

    // Gets directory strings from local system
    if (process.platform === 'win32') {
        $log.debug("Process env: ");
        $log.debug(process.env);
        if (service.localWD == "") {
            service.localWD = process.env.HOMEDRIVE + process.env.HOMEPATH;
        }
    } 
    else {
        // Runs for Mac and Linux systems
        // Establishes Displayed files
        $log.debug("process working directory: " + process.env.HOME);
        if (service.localWD == "") {
            service.localWD = process.env.HOME;
        }
    }

    localRead(service.localWD);    // Sets local display
    return service;
  
}]);
