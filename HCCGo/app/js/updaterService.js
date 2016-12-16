updaterService = angular.module('updaterService', []);
updaterService.service('updaterService', [ '$log', '$rootScope', function($log, $rootScope) {


  const {ipcRenderer} = require('electron');
  var updateDetails = null;
  
  var start = function() {
    $log.debug("Starting updater");
    
    ipcRenderer.on('updater-error', function(event, arg) {
      
      $log.error("Received updater-error event: " + arg.msg);
      
    });
    
    ipcRenderer.on('checking-for-update', function(event, arg) {
      $log.debug("Received checking-for-update event");
    });
    
    ipcRenderer.on('update-available', function(event, arg) {
      $log.debug("Received update-available event");
    });
    
    ipcRenderer.on('update-not-available', function(event, arg) {
      $log.debug("Received update-not-available event");
    });
    
    ipcRenderer.on('update-downloaded', function(event, arg) {
      $log.debug("Received update-downloaded event");
      $log.debug("Release available: " + arg.releaseName);
      $rootScope.$broadcast('update:available', arg);
      
    });
    
  };
  
  var updateRestart = function() {
    $log.debug("Restarting and updating!");
    ipcRenderer.send('updateRestart');
  }
  
  return {
  start: start,
  updateRestart: updateRestart
  }

}]);
