navBar = angular.module('HccGoApp.NavCtrl', ['ngRoute' ]);

<<<<<<< HEAD
navBar.controller('NavCtrl', ['$route', '$scope', '$routeParams', '$location', '$log', '$templateCache', 'preferencesManager', 'connectionService',
   function($route,$scope,$routeParams,$location,$log,$templateCache,preferencesManager,connectionService) {
=======
navBar.controller('NavCtrl', ['$route', '$scope', '$routeParams', '$location', '$log', 'preferencesManager', 'connectionService', 'updaterService', '$rootScope', 
   function($route,$scope,$routeParams,$location,$log,preferencesManager,connectionService, updaterService, $rootScope) {
>>>>>>> 5aba4ac9b2fd69d49d8d7ccf1663b7d46cf75e22
   // This controller intended purely to manage navigation bar
   // No code beyond navigational controls should be used here
   $scope.params = $routeParams;
   $scope.currentPath = $location.path();
   var clusterInterface = null;

   $scope.logout = function() {
      connectionService.closeStream();
      $location.path("/");
   };

   $scope.goHome = function() {
     $location.path("/cluster/" + $routeParams.clusterId);
   };

   $scope.goToSCP = function() {
      $location.path("/cluster/" + $routeParams.clusterId + "/filesystem");
   };

   // Sets username in nav bar
   //$scope.username = $templateCache.get('username');
   
   // Nav to jobHistory
   $scope.jobHistory = function() {
      $location.path("cluster/" + $scope.params.clusterId + "/jobHistory");
   }
   
   

   // For Reference
   $log.debug("Username: " + $scope.username);
   if($templateCache.get('username') == null){
      connectionService.getUsername().then(function(username) {
          $scope.username = username;
      }) 
   } else {
      $scope.username = $templateCache.get('username');
   }
   
}]);
