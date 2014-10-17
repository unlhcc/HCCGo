
welcomeModule = angular.module('HccGoApp.WelcomeCtrl', [  ]);

welcomeModule.controller('welcomeCtrl', ['$scope', '$log', '$timeout', function($scope, $log, $timeout) {
  
  $scope.login = function(cluster) {
    $log.info("Got " + cluster + " for login");
    
  };
  
  
}]);
