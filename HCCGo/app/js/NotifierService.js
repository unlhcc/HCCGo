
notifierModule = angular.module('NotifierModule', [])

notifierModule.factory('notifierService',['$log', '$q', '$routeParams', function($log, $q, $routeParams) {
  
   const {ipcRenderer} = require('electron');  
   var path = require('path');
   var fs = require('fs');

   /**
   * To initiate ssh connections to remote clusters.
   *
   */
      
  ipcRenderer.on('focus-check-message', (event, arg) => {
      $log.debug("Window is focused: " + arg);
  });
  ipcRenderer.send('focus-check-reply', 'ping');
   
  // Check the writability of a file
  var checkWritable = function(file) {
    
    var deferred = $q.defer();
    if (!file) {
      deferred.resolve(false);
    }
    
    // Write to the file to test
    async.waterfall([
      // Get the sftp module
      function(callback) {
        var sftp_return = connectionList[getClusterContext()].sftp(function (err, sftp) {
          logger.log("Got sftp now");
          if (err){
            return callback(err);
          }
          return callback(null, sftp);
        });
        
        if (!sftp_return) {
          callback("Unable to get sftp handle");
          logger.log("Unable to get sftp handle");
          return callback("Unable to get sftp handle");
        }
        
      }, function(sftp, callback){
        
        // Check for writeable directory
        path = require('path');
        // Try to write to a test file
        var dirname_path = path.dirname(file);
        var test_path = path.join(dirname_path, ".hccgo-test" + makeid());
        
        sftp.open(test_path, 'w', function(err, handle) {
          if (err){
            sftp.end();
            return callback(err);
          }
          sftp.close(handle, function(err) {
            if (err) {
              sftp.end();
              return callback(err);
            }
            return callback(null, sftp, test_path);
          });
        });
      },
      // Now, delete the file
      function(sftp, test_path, callback) {
        
        sftp.unlink(test_path, function(err) {
          if (err) {
            sftp.end();
            return callback(test_path + ": " + err);
          }
          sftp.end();
          return callback(null);
          
          
        });
        
      }
    ], function(err, results) {
      // Now, the end results
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(true);
      }

    });

    return deferred.promise;
  }

   var runCommandQueue = async.queue(function (task, callback) {
      // Starts Command session
      connectionList[getClusterContext()].exec(task.name, function(err, stream) {
         
         cumulData = "";
         
         if (err) {
           $log.error("Error running command " + task.name + ": "+ err);
           callback(err, cumulData);
           return;
         }
         
         stream.on('data', function(data) {
           
           $log.debug("Got data: " + data);
           cumulData += data;
           
         }).on('close', function(code, signal) {
           
           $log.debug('Stream :: close :: code: ' + code + ', signal: ' + signal);
           callback(null, cumulData);   // Once the command actually completes full data stored here
           
         });
      });
   }, 1);
 
   var runCommand = function(command) {

      var deferred = $q.defer();         // Used to return promise data
      
      runCommandQueue.push({name: command}, function(err, cumulData) {
          if (err) {
              deferred.reject("Error running command " + command + ": " + err);
          } else {
              deferred.resolve(cumulData);
          }
      });

      return deferred.promise;   // Asynchronous command, doesn't really return anything until deferred.resolve is called
   }
  
   return {
   getConnection: getConnection,
   runCommand: runCommand,
   getUsername: getUsername
   }
  
}]);
