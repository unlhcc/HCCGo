
clusterLandingModule = angular.module('HccGoApp.clusterLandingCtrl', ['ngRoute' ]);

clusterLandingModule.controller('clusterLandingCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', function($scope, $log, $timeout, connectionService, $routeParams) {
  
  $scope.params = $routeParams
  
}]);
