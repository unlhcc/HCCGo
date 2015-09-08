
connectionModule = angular.module('ConnectionServiceModule', [])

connectionModule.factory('connectionService',['$log', '$q', '$routeParams', function($log, $q, $routeParams) {
  
	var connectionList = {crane: null,
							tusker: null,
							sandhills: null,
							glidein: null};
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

		var deferred = $q.defer();			// Used to return promise data
		
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
			  deferred.resolve(cumulData);	// Once the command actually completes full data stored here
			  
			});
		  });
		});

		return deferred.promise;	// Asynchronous command, doesn't really return anything until deferred.resolve is called
	}
  
	var getUsername = function() {
		var deferred = $q.defer();
    
		runCommand('whoami').then(function(data) {
      
			deferred.resolve(data.trim());
      
		})
		return deferred.promise;
    
	}
    
	// Reads filesystem directory on server
	var readDir = function(directory) {
		var deferred = $q.defer();
		
		// Starts SFTP session
		connectionList[getClusterContext()].sftp(function (err, sftp) {
			if (err) throw err;		// If something happens, kills process kindly
			
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
				$log.debug(list);
			});

		});
		
		return deferred.promise;
	}
	
	// Creates directory on server
	var makeDir = function(path) {
		var destPath = [];
		var currPath = path;
		var testIndex = 0;

		// Loops through passed path to create array of desired folders
		for (var x = 0; x >= 0; x++) {
			if (currPath.indexOf('/') != -1) {
				destPath[x] = currPath.slice(0, currPath.indexOf('/'));
				currPath = currPath.slice(currPath.indexOf('/') + 1, currPath.length);
				$log.debug("makeDir currPath: " + currPath);
			} else {
				destPath[x] = currPath;
				x = -100;
			}
		}

		// Finished array
		$log.debug("destPath result: ");
		$log.debug(destPath);
		currPath = "";

		// Create folder(s)
		for (var x = 0; x < destPath.length; x++) {
			// Rebuilds relative path of directories
			currPath += (destPath[x] + '/');
			connectionList[getClusterContext()].sftp(function (err, sftp) {
				if (err) { $log.debug(err) };		// If something happens, kills process kindly
				// Debug to console
				$log.debug("SFTP has begun, creating folder " + path);
			
				sftp.mkdir(currPath, function(err) {
					if (err) {
						$log.debug(err);
						sftp.end();
					} else {
						$log.debug("SFTP :: mkdir success");
						sftp.end();
					}
				});
			
			
			// Debug to console
			$log.debug("Folder " + path + " has been created");
			});
		}
	}
	
	// Functionality to upload a file to the server
	var uploadFile = function(localPath, remotePath, callback) {
		var deferred = $q.defer();
		
		// Starts the connection
		connectionList[getClusterContext()].sftp(function (err, sftp) {
			if (err) throw err;		// If something happens, kills process kindly
			
			// Process to console
			$log.debug( "SFTP has begun");
			$log.debug( "Value of localPath: " + localPath );
			$log.debug( "Value of remotePath: " + remotePath );
			
			// Setting the I/O streams
			sftp.fastPut(localPath, remotePath, {step:function(total_transferred,chunk,total){
					callback(total_transferred, chunk, total)
				}}, 
				function(err){
					// Processes errors
					if (err) {
						$log.debug(err);
						sftp.end();
					} else {
						$log.debug("SFTP :: fastPut success");
						sftp.end();
					}
				});
			
			
		});
		
		return deferred.promise;
	}
	
	// Functionality to download a file from the server
	var downloadFile = function(localPath, remotePath, callback) {
		var deferred = $q.defer();
		
		// Starts the connection
		connectionList[getClusterContext()].sftp(function (err, sftp) {
			if (err) throw err;		// If something happens, kills process kindly
			
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
	closeStream: closeStream,
	readDir: readDir,
	makeDir: makeDir,
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
