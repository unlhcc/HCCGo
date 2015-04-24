
connectionModule = angular.module('ConnectionServiceModule', [])

connectionModule.factory('connectionService', function($log) {
  
  var connectionList = [];
  
  /**
    * To initiate ssh connections to remote clusters.
    *
    */
  
  return {
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
        
      }).connect({
        host: hostname,
        username: username,
        password: password,
        debug: function(message) {
          logger.log(message);
        }
      });
        
      
      
      connectionList.push(conn);
      
      
    }
  
  }
  
  
});
