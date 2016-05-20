
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
   
   var readDirQueue = async.queue(function (task, callback) {
      // Starts SFTP session
      connectionList[getClusterContext()].sftp(function (err, sftp) {
        if (err) throw err;      // If something happens, kills process kindly
         
         // Debug to console
         $log.debug("SFTP has begun");
         $log.debug("Reading server");
         
         // Read directory
         sftp.readdir(task.name, function(err, list) {
            if (err) {
               $log.debug("Failure on directory: " + task.name);
               $log.debug(err);
               sftp.end();
            } else {
               $log.debug("SFTP :: readdir success");
               sftp.end();
            }
            callback(list);
            //deferred.resolve(list);
            $log.debug(list);
         });
      });
   }, 3);
 
   // Reads filesystem directory on server
   var readDir = function(directory) {
      var deferred = $q.defer();
      
      readDirQueue.push({name: directory}, function(err) {
          deferred.resolve(err);
      });
      
      return deferred.promise;
   }
   
   // Creates directory on server
   // Publicly available
   var makeDir = function(dirList, root, dest, callback) {
      var attrs = {mode: '0775'};

      connectionList[getClusterContext()].sftp(function (err, sftp) {
      async.eachSeries(dirList, function(dir, done) {
          var dirs = [];
	      var exists = false;
          dir = dest + path.relative(root,dir);
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

   //Makes local directories
   var lmakeDir = function(dirList, root, dest, callback) {
      var attrs = {mode: '0775'};

      async.eachSeries(dirList, function(dir, done) {
          var dirs = [];
	      var exists = false;
          dir = dest + path.relative(root,dir);
          $log.debug("Creating folder: " + dir);
          async.until(function() {
              return exists;
          }, function(innerDone) {
              fs.stat(dir, function(err, stats) {
                  if (err) {
                      $log.debug("STAT :: LOCAL :: " + dir);
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
                      fs.mkdir(curr, function(err) {
                          if(err) $log.debug("curr: " + curr);
                          mkdone(err);
                      });
                  }, function(err){
                      done(err);
                  });
              }
          });
      }, function(err) {
              callback(err);
      });
   }

   var uploaderQueue = async.queue(function (task, callback) {
      // Starts SFTP session
      var totalCollector = 0;
      var parityCheck = true;
      connectionList[getClusterContext()].sftp(function (err, sftp) {
        sftp.fastPut(task.local, task.remote, {step:function(total_transferred,chunk,total){
                       if (parityCheck) {
                           totalCollector = total;
                           parityCheck = false;
                       }
                       task.data(total_transferred);
        },concurrency:10}, 
        function(err){
            // Processes errors
            if (err) {
                $log.debug("download error: " + task.name);
                $log.debug("task.local: " + task.local);
                $log.debug("task.remote: " + task.remote);
                $log.debug(err);
                sftp.end();
                callback(err);
            } else {
                //$log.debug("SFTP :: fastPut success");
                sftp.end();
                task.finisher(totalCollector);
                callback(null);
            }
        });
      });
   }, 4);

    var uploadFile = function (src, dest, callback, finished, error) {
        var localFiles = []; 
        var mkFolders = [];
        var filesTotal = 0;
        var currentTotal = 0;
        var sizeTotal = 0;
        var counter = 1;
        var BFSFolders = function(currDir, bfs) {
            //Recursively builds directory structure
            fs.readdir(currDir, function(err, files) {
                async.each(files, function(file, done) {
                     fs.stat(currDir + '/' + file, function(err, stats) {
                         if(err){
                             done(err);
                         } else if (stats.isFile()) {
                             localFiles.push(currDir + '/' + file);
                             sizeTotal += stats.size;
                             filesTotal += 1;
                             done(null);
                         } else if (stats.isDirectory()) {
                             if (mkFolders.indexOf(currDir) > -1) {
                                 mkFolders[mkFolders.indexOf(currDir)] = currDir + '/' + file;
                             } else {
                                 mkFolders.push(currDir + '/' + file);
                             }
                             BFSFolders(currDir + '/' + file, function(err) {
                                 if(err) {
                                     $log.debug("BFS Error on: " + currDir + "/" + file);
                                     $log.debug(err);
                                 }
                                 done(null);
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
               fs.stat(src.replace(/\/$/, ''), function(err, stats) {
                   if(stats.isDirectory()){
                       mkFolders.push(src);

                       BFSFolders(src.replace(/\/$/, ''), function(err) {
                           $log.debug("New Folders: ");
                           $log.debug(mkFolders);
                           // Set destination directory setting
                           dest = dest + path.basename(src) + '/'; 
                           water(err, true);
                       });
                   } else if (stats.isFile()) {
                       localFiles.push(src);
                       sizeTotal += stats.size;
                       filesTotal += 1;
                       src = path.dirname(src);
                       water(err, false);
                   }
               });
            },
            function(arg, water) {
               if (arg) {
                   // Get the attributes of the source directory
                   makeDir(mkFolders, src, dest, function(err) {
                       water(err);
                   });
               } else {
                   water(null);
               }
            },
            function(water) {
               // Setting the I/O streams
               async.each(localFiles, function(file, done) {
                  // Process to console
                  // $log.debug( "SFTP has begun");
                  // $log.debug( "Value of localPath: " + file );
              
                  uploaderQueue.push({
                      name: file, local: file, 
                      remote: dest + path.relative(src,file), 
                      data: function(total_transferred) {
                          callback(total_transferred, counter, filesTotal, currentTotal, sizeTotal);
                          return 0;
                      }, 
                      finisher: function(finishTotal) {
                          currentTotal += finishTotal;
                          counter += 1;
                          return 0;
                      }}, function(data) {
                          done(data);
                      });

               }, function(err) {
                  water(err);
               });
            }], 
            function(err) {
                if(err) {
                    $log.debug(err);
                    error(err);
                } else {
                    finished();
                }
       });

    }

   var remoteStatQueue = async.queue(function (task, callback) {
      // Starts SFTP session
      connectionList[getClusterContext()].sftp(function (err, sftp) {
         if (err) throw err;      // If something happens, kills process kindly
         
         // Debug to console
         $log.debug("SFTP Stat has begun");
         $log.debug("Reading server file");
         
         // Read directory
         sftp.stat(task.name, function(err, stats) {
            if (err) {
               $log.debug("Failure on directory: " + task.name);
               $log.debug(err);
               sftp.end();
            } else {
               $log.debug("SFTP :: readdir success");
               sftp.end();
            }
            callback(stats);
            //deferred.resolve(list);
            $log.debug(stats);
         });
      });
   }, 3);
 
   // Reads filesystem directory on server
   var remoteStat = function(directory) {
      var deferred = $q.defer();
      
      remoteStatQueue.push({name: directory}, function(err) {
          deferred.resolve(err);
      });
      
      return deferred.promise;
   }

    var downloaderQueue = async.queue(function (task, callback) {
      // Starts SFTP session
      var totalCollector = 0;
      var parityCheck = true;
      connectionList[getClusterContext()].sftp(function (err, sftp) {
        sftp.fastGet(task.local, task.remote, {step:function(total_transferred,chunk,total){
                       if (parityCheck) {
                           totalCollector = total;
                           parityCheck = false;
                       }
                       task.data(total_transferred);
        },concurrency:10}, 
        function(err){
            // Processes errors
            if (err) {
                $log.debug("download error: " + task.name);
                $log.debug("task.local: " + task.local);
                $log.debug("task.remote: " + task.remote);
                $log.debug(err);
                sftp.end();
                callback(err);
            } else {
                //$log.debug("SFTP :: fastPut success");
                sftp.end();
                task.finisher(totalCollector);
                callback(null);
            }
        });
      });
   }, 4);

   // Functionality to download a file from the server
   var downloadFile = function(localPath, remotePath, callback, finished, error) {
        var remoteFiles = []; 
        var mkFolders = [];
        var filesTotal = 0;
        var currentTotal = 0;
        var sizeTotal = 0;
        var counter = 1;
        
        var BFSFolders = function(currDir, bfs) {
            readDir(currDir).then(function(data) {
                async.each(data, function(file, done) {
                 remoteStat(currDir + '/' + file.filename).then(function(stats) {
                    if (stats.isFile()) {
                        remoteFiles.push(currDir + '/' + file.filename);
                        sizeTotal += stats.size;
                        filesTotal += 1;
                        done(null);
                    } else if (stats.isDirectory()) {
                        if (mkFolders.indexOf(currDir) > -1) {
                            mkFolders[mkFolders.indexOf(currDir)] = currDir + '/' + file.filename;
                        } else {
                            mkFolders.push(currDir + '/' + file.filename);
                        }
                        BFSFolders(currDir + '/' + file.filename, function(err) {
                            if(err) {
                                $log.debug("BFS Error on: " + currDir + '/' + file.filename);
                                $log.debug(err);
                            }
                            done(null);
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
               connectionList[getClusterContext()].sftp(function (err, sftp) {
                   remoteStat(remotePath.replace(/\/$/, '')).then(function(data) {
                       if (data.isDirectory()) {
                           mkFolders.push(remotePath);
                           BFSFolders(remotePath.replace(/\/$/, ''), function(err) {
                               $log.debug("New Folders: ");
                               $log.debug(mkFolders);
                               // Set destination directory setting
                               localPath = localPath + path.basename(remotePath) + '/'; 
                               water(err, true);
                           });
                       } else if (data.isFile()) {
                           remoteFiles.push(remotePath);
                           sizeTotal += data.size;
                           filesTotal += 1;
                           remotePath = path.dirname(remotePath);
                           water(err, false);
                       }
                   });
               });
            },
            function(arg, water) {
               if (arg) {      
                   // Get the attributes of the source directory
                   lmakeDir(mkFolders, remotePath, localPath, function(err) {
                       water(err);
                   });
               } else {
                   water(null);
               }
            },
            function(water) {
               // Setting the I/O streams
               var currentVal = 0;
               connectionList[getClusterContext()].sftp(function (err, sftp) {
               async.each(remoteFiles, function(file, done) {
                  // Process to console
                  //$log.debug( "SFTP has begun");
                  //$log.debug( "Value of localPath: " + file );
               
                  downloaderQueue.push({
                      name: file, local: file, 
                      remote: localPath + path.relative(remotePath,file), 
                      data: function(total_transferred) {
                          callback(total_transferred, counter, filesTotal, currentTotal, sizeTotal);
                          return 0;
                      }, 
                      finisher: function(finishTotal) {
                          currentTotal += finishTotal;
                          counter += 1;
                          return 0;
                      }}, function(data) {
                          done(data);
                      });
               }, function(err) {
                  //sftp.end();
                  water(err);
               });
               });
            }], 
            function(err) {
                if(err) {
                    $log.debug(err);
                    error(err);
                } else {
                    finished();
                }
       });

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
