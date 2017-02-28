navBar = angular.module('HccGoApp.NavCtrl', ['ngRoute' ]);

navBar.controller('NavCtrl', ['$scope', '$log', 'navService', 'connectionService', 'updaterService', 
   function($scope,$log,navService,connectionService, updaterService) {
   // This controller intended purely to manage navigation bar
   // No code beyond navigational controls should be used here
   $scope.servicer = navService;
}]);
