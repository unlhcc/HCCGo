
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
   service.params = $routeParams;
   service.currentPath = $location.path();
   service.username = new String("");

   service.logout = function() {
      connectionService.closeStream();
      $location.path("/");
   };

   service.goHome = function() {
     $location.path("/cluster/" + $routeParams.clusterId);
   };

   service.goToSCP = function() {
      $location.path("/cluster/" + $routeParams.clusterId + "/filesystem");
   };
   
   // Nav to jobHistory
   service.jobHistory = function() {
      $location.path("cluster/" + $routeParams.clusterId + "/jobHistory");
   }
   
   //if($templateCache.get('username') == null){
   connectionService.getUsername().then(function(username) {
       service.username = username;
   })
  
   return service;
  
}]);
