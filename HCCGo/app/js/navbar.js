navBar = angular.module('HccGoApp.NavCtrl', ['ngRoute' ]);

navBar.controller('NavCtrl', ['$route', '$scope', '$routeParams', '$location', '$log', 'preferencesManager', 'connectionService',
   function($route,$scope,$routeParams,$location,$log,preferencesManager,connectionService) {
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
   /*connectionService.getUsername().then(function(username) {
      $scope.username = username;
   })*/
   
   // Nav to jobHistory
   $scope.jobHistory = function() {
      $location.path("cluster/" + $scope.params.clusterId + "/jobHistory");
   }

   // For Reference
   $scope.$on('$viewContentLoaded', function() {
      $log.debug("ngView has changed");
	  $scope.currentPath = $location.path();
	  if($scope.username == null){
         connectionService.getUsername().then(function(username) {
            $scope.username = username;
         }) 
	  }
   })
   
}]);
