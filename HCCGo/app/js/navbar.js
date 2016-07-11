navBar = angular.module('HccGoApp.NavCtrl', ['ngRoute' ]);

navBar.controller('NavCtrl', ['$route', '$scope', '$routeParams', '$location', '$log', 'preferencesManager', 'connectionService',
   function($route,$scope,$routeParams,$location,$log,preferencesManager,connectionService) {
   // This controller intended purely to manage navigation bar
   // No code beyond navigational controls should be used here
   $scope.params = $routeParams;
   var clusterInterface = null;
  
   $scope.logout = function() {
      connectionService.closeStream();
      $location.path("/");
   };
   
   // Sets username in nav bar
   connectionService.getUsername().then(function(username) {
      $scope.username = username;
   })
   
   /* For Reference
   $scope.onViewLoad = function viewLoad() {
      $log.debug("ngView has changed");
      connectionService.getUsername().then(function(username) {
         $scope.username = username;
      }) 
   }*/
   
}]);
