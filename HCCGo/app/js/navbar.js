navBar = angular.module('HccGoApp.NavCtrl', ['ngRoute' ]);

navBar.controller('NavCtrl', ['$scope', '$log', 'navService', 'connectionService', 'updaterService', '$location', 
   function($scope,$log,navService,connectionService, updaterService, $location) {
   // This controller intended purely to manage navigation bar
   // No code beyond navigational controls should be used here
   $scope.servicer = navService;
   
   $scope.isActive = function (path) {
      return ($location.path().substr(0, path.length) === path);
   }
   
}]);
