
connectionModule = angular.module('ConnectionServiceModule', [])

connectionModule.factory('connectionService',['$log', '$q', function($log, $q) {
  
  var connectionList = [];
  
  /**
    * To initiate ssh connections to remote clusters.
    *
    */
    
  var getConnection = function(host) {
    
    // Check if the host exists in the conneciton list
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
    
    
  
  return {
    getConnection: getConnection,
    runCommand: runCommand,
    getUsername: getUsername,
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
        
      connectionList.push(conn);
      
      
    }
  
  }
  
  
}]);
