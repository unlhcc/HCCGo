updaterService = angular.module('updaterService', []);
updaterService.service('updaterService', [ '$log', '$rootScope', function($log, $rootScope) {


  const {ipcRenderer} = require('electron');
  var updateDetails = null;
  var updateAvailable = false;
  
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
      updateAvailable = true;
      updateDetails = arg;
      
    });
    
  };
  
  var updateRestart = function() {
    $log.debug("Restarting and updating!");
    ipcRenderer.send('updateRestart');
  }
  
  var hasUpdate = function() {
    return updateAvailable;
  }
  
  var getUpdateDetails = function() {
    return updateDetails;
  }
  
  return {
  start: start,
  updateRestart: updateRestart,
  hasUpdate: hasUpdate,
  getUpdateDetails: getUpdateDetails
  }

}]);
