
connectionModule = angular.module('ConnectionServiceModule', [])

connectionModule.factory('connectionService', function($log) {
  
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
    
    
  
  return {
    getConnection: getConnection,
    initiateConnection: function initiateConnection(username, password, hostname, logger, completed) {
      
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
          finishFunc(['1']);
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
        
      connectionList[hostname] = conn;
      
      
    }
  
  }
  
  
});
