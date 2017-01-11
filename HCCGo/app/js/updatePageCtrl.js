
updatePageModule = angular.module('HccGoApp.updatePageCtrl', ['ngRoute' ]);

updatePageModule.controller('updatePageCtrl', ['$scope', '$log', 'updaterService', function($scope, $log, updaterService) {

  var updateDetails = updaterService.getUpdateDetails();
  $scope.updateVersion = updateDetails.releaseName;

  $scope.updateRestart = function() {
    updaterService.updateRestart();
  }
  
}]);