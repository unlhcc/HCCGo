
welcomeModule = angular.module('HccGoApp.WelcomeCtrl', [ ]);

welcomeModule.controller('welcomeCtrl', ['$scope', '$log', '$timeout', 'connectionService', function($scope, $log, $timeout, connectionService) {
  
  $scope.login = function() {
    // Get the input
    $('#loginSubmit').prop('disabled', true);
    $('#loginForm').fadeTo('fast', 0.3);
    
    this.logger = new DebugLogger($('#LoginDebugWindow'))
    
    this.logger.log("Got " + $scope.username + " for login");
    
    this.logger.log("Starting login process", 'warning');
    logger = this.logger;
    
    connectionService.initiateConnection($scope.username, $scope.password, 'crane.unl.edu', this.logger, function(err) {
      if (err) {
        logger.error("Got error from connection");
        $('#loginSubmit').prop('disabled', false);
        $('#loginForm').fadeTo('fast', 1.0);
      }
      
    });
    
    
    
  };
  
  
  
}]);
