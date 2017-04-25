
connectionModule = angular.module('ConnectionServiceModule', [])

/**
 * The connectionService is used throughout the entire app, from filetransfer to login authentication.
 * Uses a mixture of protocols to accomplish these tasks.
 *
 * @ngdoc service
 * @memberof HCCGo
 * @class connectionService
 * @requires $log
 * @requires $q
 * @requires $routeParams
 * @requires $location
 * @requires notifierService
 * @requires async
 * @requires path
 * @requires fs
 * @requires ssh2
 */
connectionModule.factory('connectionService',['$log', '$q', '$routeParams', '$location', 'notifierService', 'analyticsService', '$rootScope', function($log, $q, $routeParams, $location, notifierService, analyticsService, $rootScope) {

   const async = require('async');
   const path = require('path');
   const fs = require('fs');
   var connectionDetails = {
     "username": null,
     "hostname": null,
     "shorthost": null
   }
   var connection = null;


   /**
   * To initiate ssh connections to remote clusters.
   *
   */


  /**
    * Make a random 5 character string to use for random file id's
    */
  function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }


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
        var sftp_return = connection.sftp(function (err, sftp) {
          $log.log("Got sftp now");
          if (err){
            return callback(err);
          }
          return callback(null, sftp);
        });

        if (!sftp_return) {
          callback("Unable to get sftp handle");
          $log.log("Unable to get sftp handle");
          return callback("Unable to get sftp handle");
        }

      }, function(sftp, callback){

        // Check for writeable directory
        // Try to write to a test file
        var dirname_path = path.posix.dirname(file);
        var test_path = path.posix.join(dirname_path, ".hccgo-test" + makeid());

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

  // Functionality to upload a file to the server
  var uploadJobFile = function(jobFile, remotePath) {

    var deferred = $q.defer();

    // using the 'fs' library for this, temporary until how to pass
    // process progression data is figured out

    // Starts the connection
    connection.sftp(function (err, sftp) {
      if (err) {
        deferred.reject(err);
      }
      else {
        // Process to console
        $log.debug( "SFTP has begun");
        $log.debug( "Value of remotePath: " + remotePath );

        // Setting the I/O streams
        var writeStream = sftp.createWriteStream ( remotePath );
        // Catch writestream erros
        writeStream.on('error', function (err) {
          deferred.reject(err);
        });
        // Sets logic for finishing of process
        writeStream.on(
          'close',
          function () {
            sftp.end();
            $log.debug("File has been transferred");
          }
        );

        // Does the thing
        writeStream.write(jobFile, function(err) {
          if (err) {
            deferred.reject(err);
          }
          else {
            deferred.resolve("Job successfully uploaded");
          }
        });
      }
    });
    return deferred.promise;
  }

   var submitJob = function(location) {
      var deferred = $q.defer();
      $log.debug("Running command: " + 'sbatch ' + location);
      runCommand('cd ' + path.dirname(location) + '; sbatch ' + location).then(function(data) {
        deferred.resolve(data);
      }, function(data) { // thrown on failure
        $log.log("Error log: " + data)
        return deferred.reject("An error occurred when submitting the job: " + data);
      });
      return deferred.promise;
   }

   var closeStream = function() {

     if (connection != null) {
       connection.end();
     }
   };

   var runCommandQueue = async.priorityQueue(function (task, callback) {
      // Starts Command session
      // Always source /etc/bashrc on the remote cluster before
      // running commands
      // How are we going to handle those people whose default shell is not bash?
      real_task = "if [ -f /etc/bashrc ]; then . /etc/bashrc; fi; if [ -f ~/.bashrc ]; then . ~/.bashrc; fi; " + task.name;
      connection.exec(real_task, function(err, stream) {

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

   /**
    * Run a command on the remote cluster and get the output
    * @param {String} comamnd - Command to execute
    * @param {Integer} [priority=1] - Priority of the command, default: 1.  Higher numbers have lower priority.  0 is the highest priority.
    * @memberof HCCGo.connectionService
    *
    */
   var runCommand = function(command, priority) {
      priority = (typeof priority !== 'undefined') ?  priority : 1;

      var deferred = $q.defer();         // Used to return promise data

      runCommandQueue.push({name: command}, priority, function(err, cumulData) {
          if (err) {
              deferred.reject("Error running command " + command + ": " + err);
          } else {
              deferred.resolve(cumulData);
          }
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

   var readDirQueue = async.cargo(function (task, callback) {
      // Starts SFTP session
      connection.sftp(function (err, sftp) {
         // Debug to console
         // $log.debug("SFTP has begun");
         // $log.debug("Reading server");

         // Read directory
         async.each(task, function(worker, done) {
            sftp.readdir(worker.name, function(err, list) {
               if (err) {
                  $log.debug("Failure on directory: " + task.name);
                  $log.debug(err);
                  done(err);
               } else {
                  worker.caller(list);
                  done(null);
               }
            });
         }, function(err){
            sftp.end();
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
         });
      });
   }, 20);

   // Reads filesystem directory on server
   var readDir = function(directory) {
      var deferred = $q.defer();

      readDirQueue.push({name: directory,
          caller: function(dir) {
              deferred.resolve(dir);
              return 0;
          }}, function(err) {
              if (err) {
                  deferred.reject(err);
              }
      });

      return deferred.promise;
   }

   // Creates directory on server
   // Publicly available
   var makeDir = function(dirList, root, dest, callback) {
      var attrs = {mode: '0775'};

      connection.sftp(function (err, sftp) {
      async.eachSeries(dirList, function(dir, done) {
          var dirs = [];
	      var exists = false;
          dir = dest + path.posix.relative(root,dir);
          $log.debug("Creating folder: " + dir);
          async.until(function() {
              return exists;
          }, function(innerDone) {
              sftp.stat(dir, function(err, stats) {
                  if (err) {
                      $log.debug("STAT :: SFTP :: " + dir);
                      dirs.push(dir);
                      dir = path.posix.dirname(dir);
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

   var localSize = function(dir) {
        //Recursively builds directory structure
        var deferred = $q.defer();
        var sizeTotal = 0;
        var BFSCounter = function(currDir, bfs) {
            fs.readdir(currDir, function(err, files) {
                async.each(files, function(file, done) {
                    fs.stat(currDir + '/' + file, function(err, stats) {
                        if(err){
                            done(err);
                        } else if (stats.isFile()) {
                            sizeTotal += stats.size;
                            done(null);
                        } else if (stats.isDirectory()) {
                            BFSCounter(currDir + '/' + file, function(err) {
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
        };
        fs.stat(dir, function(err, stats) {
            if (stats.isFile()) {
                deferred.resolve(stats.size);
            } else if (stats.isDirectory()) {
                BFSCounter(dir, function(err) {
                    if (err) throw err;
                    deferred.resolve(sizeTotal);
                });
            }
        });

        return deferred.promise;
   }

   // get a file size in bytes
   var getFileSize = function(filePath) {
     // takes in a string of filenames separated by spaces
     var deferred = $q.defer();

     // Use stat from sftp
     connection.sftp(function (err, sftp) {
       if(err) {
         sftp.end();
         return deferred.reject("Error getting SFTP object: " + err);
       }
       sftp.stat(filePath, function(err, stats) {
         if(err) {
           sftp.end();
           return deferred.reject("Error getting stat: " + err);
         }
         sftp.end();
         return deferred.resolve(stats.size);
       });
     });

     return deferred.promise;
   }

   // get the text of a file
   var getFileText = function(filePath) {
     var deferred = $q.defer();

    //  runCommand('cat ' + filePath).then(function(data) {
    //     deferred.resolve(data.trim());
    //  });
    connection.sftp(function (err, sftp) {
      if(err) {
        return deferred.reject("Error getting SFTP object: " + err);
      }
      var readStream = sftp.createReadStream(filePath);
      var text = "";
      readStream.on('error', function (err) {
        sftp.end();
        return deferred.reject(err);
      });

      readStream.on('data', function(chunk) {
        text += chunk;
      });

      readStream.on('end', function() {
        sftp.end()
        return deferred.resolve(text);
      });
    });

     return deferred.promise;
   }

   var uploaderQueue = async.cargo(function (task, callback) {
      // Starts SFTP session
      connection.sftp(function (err, sftp) {
        async.each(task, function(worker, done) {
            var parityCheck = true;
            var totalCollector = 0;
            sftp.fastPut(worker.local, worker.remote,
                {step:function(total_transferred,chunk,total){
                       if (parityCheck) {
                           totalCollector = total;
                           parityCheck = false;
                       }
                       worker.data(total_transferred);
            },concurrency:25},
            function(err){
                // Cleans up processing
                worker.finish(totalCollector);

                // Processes errors
                if (err) {
                    $log.debug("download error: " + worker.name);
                    $log.debug("worker.local: " + worker.local);
                    $log.debug("worker.remote: " + worker.remote);
                    $log.debug(err);
                    done(err);
                } else {
                    //$log.debug("SFTP :: fastPut success");
                    done(null);
                }
            });
        }, function(err) {
            sftp.end();
            callback(err);
        });
      });
   }, 10);

    var uploadFile = function (src, dest, callback, finished, error) {
        var localFiles = [];
        var mkFolders = [];
        var filesTotal = 0;
        var currentTotal = 0;
        var sizeTotal = 0;
        var counter = 0;
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
                           dest = dest + path.posix.basename(src) + '/';
                           water(err, true);
                       });
                   } else if (stats.isFile()) {
                       localFiles.push(src);
                       sizeTotal += stats.size;
                       filesTotal += 1;
                       src = path.posix.dirname(src);
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
                      remote: dest + path.posix.relative(src,file),
                      data: function(total_transferred) {
                          callback(total_transferred, counter, filesTotal, currentTotal, sizeTotal);
                          return 0;
                      }, finish: function(finishTotal) {
                          currentTotal += finishTotal;
                          counter += 1;
                          callback(0, counter, filesTotal, currentTotal, sizeTotal);
                      }}, function(err) {
                          done(err);
                      });

               }, function(err) {
                  water(err);
               });
            }],
            function(err) {
                if(err) {
                    analyticsService.event('file upload', 'fail');
                    $log.debug(err);
                    error(err);
                } else {
				    analyticsService.event('file upload', 'success', '', sizeTotal);
                    finished();
                }
       });
    }

   var remoteStatQueue = async.cargo(function (task, callback) {
      // Starts SFTP session
      connection.sftp(function (err, sftp) {
         // Debug to console
         // $log.debug("SFTP Stat has begun");
         // $log.debug("Reading server file");

         // Read directory
         async.each(task, function(worker, done) {
            sftp.stat(worker.name, function(err, stats) {
               if (err) {
                  $log.debug("Failure on directory: " + task.name);
                  $log.debug(err);
                  done(err);
               } else {
                  worker.caller(stats);
                  done(null);
               }
            });
         }, function(err) {
            sftp.end();
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
         });
      });
   }, 20);

   // Reads filesystem directory on server
   var remoteStat = function(directory) {
      var deferred = $q.defer();

      remoteStatQueue.push({name: directory,
          caller: function(stat){
              deferred.resolve(stat);
              return 0;
          }}, function(err) {
              if (err) {
                  deferred.reject(err);
              }
      });

      return deferred.promise;
   }

    var downloaderQueue = async.cargo(function (task, callback) {
      // Starts SFTP session
     connection.sftp(function (err, sftp) {
        async.each(task, function(worker, done) {
          var totalCollector = 0;
          var parityCheck = true;
          sftp.fastGet(worker.local, worker.remote,
             {step:function(total_transferred,chunk,total){
                       if (parityCheck) {
                           totalCollector = total;
                           parityCheck = false;
                       }
                       worker.data(total_transferred);
             },concurrency:25},
             function(err){
                // Finishes processing and sends total
                worker.finish(totalCollector);

                // Processes errors
                if (err) {
                   $log.debug("download error: " + worker.name);
                   $log.debug("task.local: " + worker.local);
                   $log.debug("task.remote: " + worker.remote);
                   $log.debug(err);
                   done(err);
                } else {
                   //$log.debug("SFTP :: fastPut success");
                   done(null);
                }
          });
        }, function(err) {
            sftp.end();
            callback(err);
        });
      });
   }, 10);

   // Functionality to download a file from the server
   var downloadFile = function(localPath, remotePath, callback, finished, error) {
        var remoteFiles = [];
        var mkFolders = [];
        var filesTotal = 0;
        var currentTotal = 0;
        var sizeTotal = 0;
        var counter = 0;

        var BFSFolders = function(currDir, bfs) {
            readDir(currDir).then(function(data) {
                async.each(data, function(file, done) {
                    if (file.longname.charAt(0) != 'd') {
                        remoteStat(currDir + '/' + file.filename).then(function(stats) {
                            remoteFiles.push(currDir + '/' + file.filename);
                            sizeTotal += stats.size;
                            filesTotal += 1;
                            done(null);
                        });
                    } else if (file.longname.charAt(0) == 'd') {
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
                }, function(err) {
                    bfs(err);
                });
            });
        }
        // Starts the connection
        async.waterfall([
            function(water) {
               remoteStat(remotePath.replace(/\/$/, '')).then(function(data) {
                   if (data.isDirectory()) {
                       mkFolders.push(remotePath);
                       BFSFolders(remotePath.replace(/\/$/, ''), function(err) {
                           $log.debug("New Folders: ");
                           $log.debug(mkFolders);
                           // Set destination directory setting
                           localPath = localPath + path.basename(remotePath) + '/';
						   localPath = path.normalize(localPath);
                           water(err, true);
                       });
                   } else if (data.isFile()) {
                       remoteFiles.push(remotePath);
                       sizeTotal += data.size;
                       filesTotal += 1;
                       remotePath = path.dirname(remotePath);
                       water(null, false);
                   }
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
               async.each(remoteFiles, function(file, done) {
                  // Process to console
                  downloaderQueue.push({
                      name: file, local: file,
                      remote: localPath + path.relative(remotePath,file),
                      data: function(total_transferred) {
                          callback(total_transferred, counter, filesTotal, currentTotal, sizeTotal);
                          return 0;
                      }, finish: function(finishTotal) {
                          currentTotal += finishTotal;
                          counter += 1;
                          callback(0, counter, filesTotal, currentTotal, sizeTotal);
                          return 0;
                      }}, function(err) {
                          done(err);
                      });
               }, function(err) {
                  //sftp.end();
                  water(err);
               });
            }],
            function(err) {
                if(err) {
                    analyticsService.event('file download', 'fail');
                    $log.debug(err);
                    error(err);
                } else {
				    analyticsService.event('file download', 'success', '', sizeTotal);
                    finished();
                }
       });

   };

   /**
    * Allows a user to quickly download a file from the server
    * @method quickDownload
    * @memberof HCCgo.connectionService
    * @param {String} remotePath - Where the file resides on the server
    * @param {String} localPath - Location where the file will be sent
    * @returns {Promise} A promise denoting whether the process was successful or not
    */
   var quickDownload = function(remotePath, localPath) {
       var deferred = $q.defer();
       connection.sftp(function (err, sftp) {
           if (err) {
               deferred.reject(err);
           }
           else
           {
               sftp.fastGet(remotePath, localPath, function(err) {
                   console.log("File transfer successful!");
                   sftp.end();
                   deferred.resolve(true);
               });
           }
       });
       return deferred.promise;
   };
   return {
   runCommand: runCommand,
   getUsername: getUsername,
   uploadFile: uploadFile,
   downloadFile: downloadFile,
   quickDownload: quickDownload,
   submitJob: submitJob,
   closeStream: closeStream,
   readDir: readDir,
   makeDir: makeDir,
   localSize: localSize,
   getHomeWD: getHomeWD,
   getWorkWD: getWorkWD,
   uploadJobFile: uploadJobFile,
   checkWritable: checkWritable,
   getFileText: getFileText,
   getFileSize: getFileSize,
   connectionDetails: connectionDetails,
   initiateConnection: function initiateConnection(username, password, hostname, cluster, needInput, completed) {

     var Client = require('ssh2').Client;
     var conn = new Client();
     try {

     if (username.length === 0 || password.length === 0)
     {
         completed("0 Length username or password given");
     }

     conn.on('ready', function() {
      connectionDetails['username'] = username;
      connectionDetails['hostname'] = hostname;
      connectionDetails['shorthost'] = cluster;
      completed(null);
      $rootScope.$broadcast("login");
      $log.log('Client :: ready');
     }).on('error', function(err) {
      $log.error(err);
      completed(err);


     }).on('keyboard-interactive', function(name, instructions,  instructionsLang, prompts, finishFunc) {
      $log.log("Name: " + name + ", instructions: " + instructions + "prompts" + prompts);


      if (prompts[0].prompt == "Password: ") {
        finishFunc([password]);
      } else {
        $log.log(prompts[0].prompt);
        needInput(prompts[0].prompt, function(input) {
            if (input < 1 || input > 3)
            {
                completed("Duo error");
            }
         finishFunc([input]);
        });
      }
      }).on('close', function(hadError) {
        $log.error("Connection closed");
        if (hadError) $log.error("Error while closing connection");
        notifierService.error("Disconnected from cluster", "Disconnection");
        $location.path("/");
      }).on('end', function() {
        $log.error("Connection ended");

     }).connect({
      host: hostname,
      username: username,
      tryKeyboard: true,
      readyTimeout: 99999999,
      debug: function(message) {
      //$log.log(message);
      }

    });
     }
     catch(err) {
         completed(err);
     }

     connection = conn;

   }

   }

}]);
