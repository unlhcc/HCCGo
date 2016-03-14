
connectionModule = angular.module('ConnectionServiceModule', [])

connectionModule.factory('connectionService',['$log', '$q', '$routeParams', function($log, $q, $routeParams) {
  
   var connectionList = {crane: null,
                     tusker: null,
                     sandhills: null,
                     glidein: null};
   var async = require('async');
   var path = require('path');
   var fs = require('fs');
   $log.debug(connectionList);

   /**
   * To initiate ssh connections to remote clusters.
   *
   */
      
   // Returns the context of the connection (if cluster is Sandhills, use Sandhills connection etc...)
   var getClusterContext = function() {
      switch($routeParams.clusterId) {
         case "Crane":
            return 'crane';
            break;
         case "Tusker":
            return 'tusker';
            break;
         case "Sandhills":
            return 'sandhills';
            break;
         case "Glidein":
            return 'glidein';
            break;
         default:
            return 'crane';
      }
   }
   
   // Checks if connection for a cluster exists
   var getConnection = function(host) {
      // Check if the host exists in the connection list
      switch($routeParams.clusterId) {
         case "Crane":
            if (connectionList['crane'] != null) {
               return true;
            } else {
               return false;
            }
            break;
         case "Tusker":
            if (connectionList['tusker'] != null) {
               return true;
            } else {
               return false;
            }
            break;
         case "Sandhills":
            if (connectionList['sandhills'] != null) {
               return true;
            } else {
               return false;
            }
            break;
         case "Glidein":
            if (connectionList['glidein'] != null) {
               return true;
            } else {
               return false;
            }
            break;
         default:
            return false;
      }

   };

  // Functionality to upload a file to the server
  var uploadJobFile = function(jobFile, remotePath) {
    // using the 'fs' library for this, temporary until how to pass
    // process progression data is figured out
    var fs = require('fs');

    // Starts the connection
    connectionList[getClusterContext()].sftp(function (err, sftp) {
      if (err) throw err;		// If something happens, kills process kindly

      // Process to console
      $log.debug( "SFTP has begun");
      $log.debug( "Value of remotePath: " + remotePath );

      // Setting the I/O streams
      var writeStream = sftp.createWriteStream ( remotePath );

      // Sets logic for finishing of process
      writeStream.on(
        'close',
        function () {
          sftp.end();
          $log.debug("File has been transferred");
        }
      );

      // Does the thing
      writeStream.write(jobFile);
    });

    return 0;
  }

   var submitJob = function(location) {
      var deferred = $q.defer();

      runCommand('sbatch ' + location).then(function(data) {
          deferred.resolve(data);
      })
      return deferred.promise;
   }

   var closeStream = function() {
      // Closes the connection stream
      var clusters = ['crane','tusker','sandhills','glidein'];
      for (var x = 0; x < clusters.length; x++) {
         if (connectionList[clusters[x]] != null) {
            connectionList[clusters[x]].end();
            connectionList[clusters[x]] = null;
         }
      }
   };

   var commandSem = require('semaphore')(1);

   var runCommand = function(command) {

      var deferred = $q.defer();         // Used to return promise data
      
      commandSem.take(function() {

        // Run a command remotely
        connectionList[getClusterContext()].exec(command, function(err, stream) {
         
         cumulData = "";
         
         if (err) {
           $log.error("Error running command " + command + ": "+ err);
           commandSem.leave();
           deferred.reject("Error running command " + command + ": "+ err);
           return;
         }
         
         stream.on('data', function(data) {
           
           $log.debug("Got data: " + data);
           cumulData += data;
           
         }).on('close', function(code, signal) {
           
           $log.debug('Stream :: close :: code: ' + code + ', signal: ' + signal);
           commandSem.leave();
           deferred.resolve(cumulData);   // Once the command actually completes full data stored here
           
         });
        });
      });

      return deferred.promise;   // Asynchronous command, doesn't really return anything until deferred.resolve is called
   }
  
   var getUsername = function() {
      var deferred = $q.defer();
    
      runCommand('whoami').then(function(data) {
      
         deferred.resolve(data.trim());
      
      })
      return deferred.promise;
    
   }

  var test = function() {
    alert("Success");
  }

   var getHomeWD = function() {
     var deferred = $q.defer();
     runCommand('echo $HOME').then(function(data) {
         $log.debug("Home dir: " + data);
         deferred.resolve(data.trim());
     });
     return deferred.promise;
   }

   var getWorkWD = function() {
     var deferred = $q.defer();
     runCommand('echo $WORK').then(function(data) {
         $log.debug("Word dir: " + data);
         deferred.resolve(data.trim());
     });
     return deferred.promise;
   }
    
   // Reads filesystem directory on server
   var readDir = function(directory) {
      var deferred = $q.defer();
      
      //commandSem.take(function () {
      // Starts SFTP session
      connectionList[getClusterContext()].sftp(function (err, sftp) {
        if (err) throw err;      // If something happens, kills process kindly
         
         // Debug to console
         $log.debug("SFTP has begun");
         $log.debug("Reading server");
         
         // Read directory
         sftp.readdir(directory, function(err, list) {
            if (err) {
               $log.debug(err);
               sftp.end();
            } else {
               $log.debug("SFTP :: readdir success");
               sftp.end();
            }
            
            deferred.resolve(list);
            $log.debug("READDIR COMMANDSEM LEAVE");
            //commandSem.leave();
            $log.debug(list);
         });
      });
      //});
      
      return deferred.promise;
   }
   
   // Creates directory on server
   // Publicly available
   var makeDir = function(dirList, root, callback) {
      var attrs = {mode: '0775'};

      connectionList[getClusterContext()].sftp(function (err, sftp) {
      async.eachSeries(dirList, function(dir, done) {
          var dirs = [];
	      var exists = false;
          dir = './' + path.basename(root) + '/' + path.relative(root,dir);
          $log.debug("Creating folder: " + dir);
          async.until(function() {
              return exists;
          }, function(innerDone) {
              sftp.stat(dir, function(err, stats) {
                  if (err) {
                      $log.debug("STAT :: SFTP :: " + dir);
                      dirs.push(dir);
                      dir = path.dirname(dir);
                  } else {
                      exists = true;
                  }
                  innerDone();
              });
          }, function(err) {
              if (err) {
                  done(err)
              } else {
                  async.eachSeries(dirs.reverse(), function(curr, mkdone) {
                      sftp.mkdir(curr, function(err) {
                          if(err) $log.debug("curr: " + curr);
                          mkdone(err);
                      });
                  }, function(err){
                      done(err);
                  });
              }
          });
      }, function(err) {
              sftp.end();
              callback(err);
      });
      });
   }

    var uploadFile = function (src, dest, callback) {

        var localFiles = []; 
        var mkFolders = [];
        var filesTotal = 0;
        var counter = 0;
        var BFSFolders = function(currDir, bfs) {
            //Recursively builds directory structure
            fs.readdir(currDir, function(err, files) {
                async.each(files, function(file, bfs) {
                     fs.stat(currDir + '/' + file, function(err, stats) {
                         if(err){
                             bfs(err);
                         } else if (stats.isFile()) {
                             localFiles.push(currDir + '/' + file);
                             filesTotal += 1;
                             bfs(err);
                         } else if (stats.isDirectory()) {
                             if (mkFolders.indexOf(currDir) > -1) {
                                 mkFolders[mkFolders.indexOf(currDir)] = currDir + '/' + file;
                             } else {
                                 mkFolders.push(currDir + '/' + file);
                             }
                             BFSFolders(currDir + '/' + file, function(err) {
                                 bfs(err);
                             });
                         }
                     });
                }, function(err) {
                    bfs(err);
                });
            });
        }
        // Starts the connection
        async.waterfall([
            function(water) {
               fs.stat(src.replace(/\/$/, ''), function(err, stats){
                   if(stats.isDirectory()){
                       BFSFolders(src.replace(/\/$/, ''), function(err) {
                           $log.debug("New Folders: ");
                           $log.debug(mkFolders);
                           // Set destination directory setting
                           dest = dest + path.basename(src) + '/' 
                           water(err, true);
                       });
                   } else if (stats.isFile()) {
                      localFiles.push(src);
                      src = path.dirname(src);
                      water(err, false);
                   }
               });
            },
            function(needMk, water) {      
               // Get the attributes of the source directory
               if (needMk) {
                   makeDir(mkFolders, src, function(err) {
                       water(err);
                   });
               } else {
                   water(null);
               }
            },
            function(water) {
               // Setting the I/O streams

               connectionList[getClusterContext()].sftp(function (err, sftp) {
               async.eachSeries(localFiles, function(file, done) {
                  // Process to console
                  $log.debug( "SFTP has begun");
                  $log.debug( "Value of localPath: " + file );
               
                  sftp.fastPut(file, dest + path.relative(src,file), {step:function(total_transferred,chunk,total){
                       callback(total_transferred, chunk, total, counter, filesTotal)
                  }}, 
                  function(err){
                    // Processes errors
                    if (err) {
                       $log.debug("upload error: " + file);
                       $log.debug(err);
                       done(err);
                    } else {
                       $log.debug("SFTP :: fastPut success");
                       counter += 1;
                       done(null);
                    }
                  });
               }, function(err) {
                  sftp.end();
                  water(err);
               });
               });
            }], 
            function(err) {
                if(err) {
                    $log.debug(err);
                    callback(err);
                }
       });

    }


   
   // Functionality to download a file from the server
   var downloadFile = function(localPath, remotePath, callback) {
      var deferred = $q.defer();
      
      // Starts the connection
      connectionList[getClusterContext()].sftp(function (err, sftp) {
         if (err) throw err;      // If something happens, kills process kindly
         
         // Process to console
         $log.debug( "SFTP has begun");
         $log.debug( "Value of localPath: " + localPath );
         $log.debug( "Value of remotePath: " + remotePath );
         
         // Setting the I/O streams
         sftp.fastGet(remotePath, localPath, {step:function(total_transferred,chunk,total){
               callback(total_transferred, chunk, total)
            }}, 
            function(err){
               // Processes errors
               if (err) {
                  $log.debug(err);
                  sftp.end();
               } else {
                  $log.debug("SFTP :: fastGet success");
                  sftp.end();
               }
            });
      });
      
      return deferred.promise;
   }
  
   return {
   getConnection: getConnection,
   runCommand: runCommand,
   getUsername: getUsername,
   uploadFile: uploadFile,
   downloadFile: downloadFile,
   submitJob: submitJob,
   closeStream: closeStream,
   readDir: readDir,
   makeDir: makeDir,
   getHomeWD: getHomeWD,
   getWorkWD: getWorkWD,
   uploadJobFile: uploadJobFile,
   initiateConnection: function initiateConnection(username, password, hostname, cluster, logger, needInput, completed) {
     
     var Client = require('ssh2').Client;
     var conn = new Client();
     
     conn.on('ready', function() {
      completed(null);
      logger.log('Client :: ready')
      conn.exec('uptime', function (err, stream) {
        if (err) {
         logger.error("Error Logging executing");
         console.log(err)
         return;
        }
        
        stream.on('close', function(code, signal) {
         logger.log('Stream :: close :: code: ' + code + ', signal: ' + signal)
         
        }).on('data', function(data) {
         logger.log('STDOUT' + data);
        }).stderr.on('data', function(data) {
         logger.log('STDERR' + data);
        });
      });
     }).on('error', function(err) {
      logger.error(err);
      completed(err);
     //}).on('close', function() {
         
     }).on('keyboard-interactive', function(name, instructions,  instructionsLang, prompts, finishFunc) {
      logger.log("Name: " + name + ", instructions: " + instructions + "prompts" + prompts);
      console.log(prompts);
      
      if (prompts[0].prompt == "Password: ") {
        finishFunc([password]);
      } else {
        logger.log(prompts[0].prompt);
        needInput(prompts[0].prompt, function(input) {
         finishFunc([input]);
        });
      }
      
      
     }).connect({
      host: hostname,
      username: username,
      tryKeyboard: true,
      readyTimeout: 99999999,
      debug: function(message) {
        //logger.log(message);
      }
     });
      
      switch(cluster) {
      case "Crane":
         connectionList['crane'] = conn;
         break;
      case "Tusker":
         connectionList['tusker'] = conn;
         break;
      case "Sandhills":
         connectionList['sandhills'] = conn;
         break;
      case "Glidein":
         connectionList['glidein'] = conn;
         break;
      default:
         return false;
     }
     $log.debug(connectionList);
    
   }

   }
  
}]);
