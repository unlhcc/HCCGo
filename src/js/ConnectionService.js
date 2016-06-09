
connectionModule = angular.module('ConnectionServiceModule', [])

connectionModule.factory('connectionService',['$log', '$q', function($log, $q) {

  var connectionList = [];

  /**
    * To initiate ssh connections to remote clusters.
    *
    */

  var getConnection = function(host) {

    // Check if the host exists in the connection list
    if( connectionList.hasOwnProperty(host)) {
      return connectionList[host];
    } else {
      return null;
    }

  };


  var commandSem = require('semaphore')(1);

  var runCommand = function(command) {

    var deferred = $q.defer();

    commandSem.take(function() {

      // Run a command remotely
      connectionList[0].exec(command, function(err, stream) {

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
          deferred.resolve(cumulData);

        }).stderr.on('data', function(data) {
          $log.error('STDERR: ' + data);
        });


      });


    });



    return deferred.promise;

  }

  var getUsername = function() {
    var deferred = $q.defer();

    runCommand('whoami').then(function(data) {

      deferred.resolve(data.trim());

    })

    return deferred.promise;

  }

  // Functionality to upload a file to the server
  var uploadJobFile = function(jobFile, remotePath) {

    var deferred = $q.defer();

    // using the 'fs' library for this, temporary until how to pass
    // process progression data is figured out
    var fs = require('fs');

    // Starts the connection
    connectionList[0].sftp(function (err, sftp) {
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
      runCommand('sbatch ' + location).then(function(data) {
        deferred.resolve(data);
      }, function(data) { // thrown on failure
        logger.log("Error log: " + data)
        return deferred.reject("An error occurred when submitting the job.");
      });
      return deferred.promise;
  }

  var test = function() {
    alert("Success");
  }
  return {
    getConnection: getConnection,
    runCommand: runCommand,
    getUsername: getUsername,
    uploadJobFile: uploadJobFile,
    submitJob: submitJob,
    initiateConnection: function initiateConnection(username, password, hostname, logger, needInput, completed) {

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
          logger.log(message);
        }
      });

      connectionList[0] = conn;


    }

  }


}]);
