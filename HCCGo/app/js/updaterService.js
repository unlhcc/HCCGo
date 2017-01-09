
updaterModule = angular.module('updaterModule', []);

/**
 * @memberof HCCGo
 * @ngdoc service
 * @class updaterService
 * @param $log {service} Logging for angularjs
 * @param $rootScope {service} Root Scope
 */
var updaterService = function($log, $rootScope) {

  const {ipcRenderer} = require('electron');
  var updateDetails = null;
  var updateAvailable = false;
  
  
  /**
   * Start the updater and sets listeners for the update events.
   * @method start
   * @memberof HCCGo.updaterService
   */
  this.start = function() {
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
  
  /**
   * Update and restart HCCGo
   * @memberof HCCGo.updaterService
   * @function updateRestart
   */
  this.updateRestart = function() {
    $log.debug("Restarting and updating!");
    ipcRenderer.send('updateRestart');
  }
  
  /**
   * Check if there is an update available
   * @return {bool} True if there is an update available, false otherwise.
   * @memberof HCCGo.updaterService
   * @function hasUpdate
   */
  this.hasUpdate = function() {
    return updateAvailable;
  }
  
  /**
   * Get the details for the update
   * @return {UpdateDeatils} Deatils of the update
   * @memberof HCCGo.updaterService
   * @function getUpdateDetails
   */
  this.getUpdateDetails = function() {
    return updateDetails;
  }
  
}
updaterModule.service('updaterService', [ '$log', '$rootScope', updaterService]);


/**
 * @memberof HCCGo
 * @ngdoc controller
 * @class updaterButtonCtrl
 * @param $scope {service} Local controller scope
 * @param updaterService {service} Updater Service
 * @param $location {service} Location service
 */
var updaterButtonCtrl = function($scope, updaterService, $location) {  

  /**
   * Function called when update is detected
   * @private 
   * @memberof HCCGo.updaterButtonCtrl
   */
   var setUpdate = function(updateDetails) {
      $scope.update = updateDetails
      $scope.updateAvailable = true;
   }
   
   $scope.$on('update:available', function(event, updateDetails) {
      $scope.$apply(function() {
        setUpdate(updateDetails);
      });
      
   });
   
   if (updaterService.hasUpdate()) {
      setUpdate(updaterService.updateDetails);
   }
   
   /**
    * Restart and update when the button is pressed
    * @function restartUpdate
    * @memberof HCCGo.updaterButtonCtrl
    */
   $scope.restartUpdate = function() {
      updaterService.updateRestart();
   }
   
   /**
    * Change the view to the update dialog
    * @function updateDialog
    * @memberof HCCGo.updaterButtonCtrl
    */ 
   $scope.updateDialog = function() {
      
      $location.path("/update");
      
   }
  
}

updaterModule.controller('updateButtonCtrl', ['$scope', 'updaterService', '$location', updaterButtonCtrl]);
