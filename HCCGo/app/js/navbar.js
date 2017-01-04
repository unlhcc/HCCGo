navBar = angular.module('HccGoApp.NavCtrl', ['ngRoute' ]);

navBar.controller('NavCtrl', ['$route', '$scope', '$routeParams', '$location', '$log', 'preferencesManager', 'connectionService', 'updaterService', '$rootScope', 
   function($route,$scope,$routeParams,$location,$log,preferencesManager,connectionService, updaterService, $rootScope) {
   // This controller intended purely to manage navigation bar
   // No code beyond navigational controls should be used here
   $scope.params = $routeParams;
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
   connectionService.getUsername().then(function(username) {
      $scope.username = username;
   })

   // Nav to jobHistory
   $scope.jobHistory = function() {
      $location.path("cluster/" + $scope.params.clusterId + "/jobHistory");
   }
   
   
   /* Handle updates
   */
   var setUpdate = function(updateDetails) {
      $scope.update = updateDetails
      $scope.updateAvailable = true;
   }
   
   $scope.$on('update:available', function(event, updateDetails) {
      setUpdate(updateDetails);
   });
   
   if (updaterService.hasUpdate()) {
      setUpdate(updaterService.updateDetails);
   }
   
   $scope.restartUpdate = function() {
      updaterService.updateRestart();
   }
   

   /* For Reference
   $scope.onViewLoad = function viewLoad() {
      $log.debug("ngView has changed");
      connectionService.getUsername().then(function(username) {
         $scope.username = username;
      })
   }*/

}]);
