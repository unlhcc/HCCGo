
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
   angular.element("title").text("Home");

   service.logout = function() {
      connectionService.closeStream();
      $location.path("/");
      angular.element("title").text("HCC Go");
   };

   service.goHome = function() {
     $location.path("/cluster");
     angular.element("title").text("Home");
   };

   service.goToSCP = function() {
      $location.path("/filesystem");
      angular.element("title").text("File Transfer");
   };
   
   // Nav to jobHistory
   service.jobHistory = function() {
      $location.path("/jobHistory");
      angular.element("title").text("Job History");
   }
   
   service.goToTutorials = function() {
      $location.path("/tutorials");
      angular.element("title").text("Tutorials");
   }
   
   //if($templateCache.get('username') == null){
   service.username = connectionService.connectionDetails.username;
   service.host = connectionService.connectionDetails.hostname;
   return service;
  
}]);
