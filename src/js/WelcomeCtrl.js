
welcomeModule = angular.module('HccGoApp.WelcomeCtrl', [ ]);

welcomeModule.controller('welcomeCtrl', ['$scope', '$log', '$timeout', 'connectionService', function($scope, $log, $timeout, connectionService) {
  
  $scope.login = function() {
    // Get the input
    $('#loginSubmit').prop('disabled', true);
    $('#loginForm').fadeTo('fast', 0.3);
    
    this.logger = new DebugLogger($('#LoginDebugWindow'))
    
    username = $('#inputUsername').val();
    password = $('#inputPassword').val();
    this.logger.log("Got " + username + " for login");
    
    this.logger.log("Starting login process", 'warning');
    logger = this.logger;
    
    connectionService.initiateConnection(username, password, 'red-foreman.unl.edu', this.logger, function(err) {
      if (err) {
        logger.error("Got error from connection");
        $('#loginSubmit').prop('disabled', false);
        $('#loginForm').fadeTo('fast', 1.0);
      }
      
    });
    
    
    
  };
  
  
  
}]);
