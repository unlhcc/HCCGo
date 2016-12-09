updaterService = angular.module('updaterService', []);
updaterService.service('updaterService', [ '$log', function($log) {


  const {ipcRenderer} = require('electron');
  
  
  
  var start = function() {
    $log.debug("Starting updater");
    
    ipcRenderer.on('updater-error', function(event, arg) {
      
      $log.error("Received updater-error event: " + arg);
      
    });
    
    ipcRenderer.on('checking-for-update', function(event, arg) {
      $log.debug("Received checking-for-update event");
    });
    
    ipcRenderer.on('update-available', function(event, arg) {
      $log.debug("Received update-available event");
    });
    
    ipcRenderer.on('update-not-available', fuction(event, arg) {
      $log.debug("Received update-not-available event");
    });
    
    ipcRenderer.on('update-downloaded', function(event, arg) {
      $log.debug("Received update-downloaded event");
    });
    
  };
  
  
  return {
  start: start,
  }

}]);
