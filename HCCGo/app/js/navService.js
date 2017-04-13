
fileManageService = angular.module('navService', [])

fileManageService.factory('navService',['$log', '$q', '$location', '$routeParams', 'connectionService', 'notifierService', '$timeout', '$rootScope',
   function($log, $q, $location, $routeParams, connectionService, notifierService, $timeout, $rootScope) {

   let service = {};
   const ipcRenderer = require('electron').ipcRenderer;

   /**
   * To handle state information for the navigation bar
   *
   */
   $rootScope.$on('login', function(event) {
      // on login event, update the username and host information
      service.username = connectionService.connectionDetails.username;
      service.host = connectionService.connectionDetails.hostname;
   });


   // Value initialization
   //
   // Gets directory strings from remote server
   //
   service.currentPath = $location.path();
   service.username = new String("");

   service.logout = function() {
      connectionService.closeStream();
      $location.path("/");
   };

   service.goHome = function() {
     $location.path("/cluster");
   };

   service.goToSCP = function() {
      $location.path("/filesystem");
   };

   // Nav to jobHistory
   service.jobHistory = function() {
      $location.path("/jobHistory");
   }

   service.goToTutorials = function() {
      $location.path("/tutorials");
   }

   service.goToPreferences = function() {
     $location.path("/preferences");
   }

   service.goToDashboard = function() {
     $location.path("/cluster");
   }

   //if($templateCache.get('username') == null){
   service.username = connectionService.connectionDetails.username;
   service.host = connectionService.connectionDetails.hostname;

   // Get the Version
   ipcRenderer.send('get-version');
   ipcRenderer.on('get-version-message', function(event, arg) {
      service.version = arg;

   });


>>>>>>> master
   return service;

}]);
