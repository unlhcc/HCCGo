
fileManageService = angular.module('navService', [])

fileManageService.factory('navService',['$log', '$q', '$location', '$routeParams', 'connectionService', 'notifierService', '$timeout',
   function($log, $q, $location, $routeParams, connectionService, notifierService, $timeout) {

   let service = {};

   /**
   * To handle state information for the navigation bar
   *
   */

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

   //if($templateCache.get('username') == null){
   service.username = connectionService.connectionDetails.username;
   service.host = connectionService.connectionDetails.hostname;

   return service;

}]);
