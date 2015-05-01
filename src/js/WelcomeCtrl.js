
welcomeModule = angular.module('HccGoApp.WelcomeCtrl', [ ]);

welcomeModule.controller('welcomeCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$location', function($scope, $log, $timeout, connectionService, $location) {
  
  $scope.clusters = [
    { label: 'Crane', url: 'crane.unl.edu', type: 'slurm' },
    { label: 'Tusker', url: 'tusker.unl.edu', type: 'slurm' },
    { label: 'Sandhills', url: 'sandhills.unl.edu', type: 'slurm' },
    { label: 'Glidein', url: 'glidein.unl.edu', type: 'condor' }
  ];
  
  var $selector = $('#clusterSelect').selectize({
    
    createOnBlur: true,
    labelField: 'label',
    options: $scope.clusters,
    items: [ $scope.clusters[0].url ],
    searchField: 'label',
    valueField: 'url',
    selectOnTab: true,
    render: {
      'option': function(data, escape) {
  		    return '<div><span class="clusterLabel">' + escape(data.label) + '</span>' + '<span class="url">' + escape(data.url) + '</span></div>';
    	 },
       'option_create': function(data, escape) {
         return '<div class="create">Hostname: <strong>' +  escape(data.input) + '</strong>&hellip;</div>';
       }
     },
     create: function(input, callback) {
       new_object = {}
       new_object.label = input.split(".")[0];
       new_object.url = input;
       new_object.type = 'slurm';
       $scope.clusters.push(new_object);
       callback(new_object);
      
     }
       
     
    
  });
  
  var selection = $selector[0].selectize;
  
  $scope.login = function() {
    // Get the input
    $('#loginSubmit').prop('disabled', true);
    $('#loginForm').fadeTo('fast', 0.3);
    
    var connectUrl = selection.getValue();
    $scope.selectedCluster = $.grep($scope.clusters, function(e) {return e.url == connectUrl})[0];
    
    this.logger = new DebugLogger($('#LoginDebugWindow'))
    
    this.logger.log("Got " + $scope.username + " for login");
    
    this.logger.log("Starting login process", 'warning');
    logger = this.logger;
    
    connectionService.initiateConnection($scope.username, $scope.password, connectUrl, this.logger, userPrompt,  function(err) {
      $scope.$apply(function() {
        
        if (err) {
          logger.error("Got error from connection");
          $('#loginSubmit').prop('disabled', false);
          $('#loginForm').fadeTo('fast', 1.0);
        } else {
          
          $location.path("/cluster/" + $scope.selectedCluster.label)
          
        }
        
        
      });
      
      
      
    });
    
    
    
  };
  
  $scope.transformCustom = function(customUrl) {
    
    this.logger.log("Got custom attribute: " + customUrl);
    return { label: customUrl, url: customUrl, type: 'slurm'};
    
  };
  
  
  userPrompt = function(prompt, finishFunc) {
    $scope.$apply(function() {
      $scope.userPrompt = prompt;
    
      $("#promptModal").modal('show');
      $scope.finishFunc = finishFunc;
    });
    
  };
  
  $scope.promptComplete = function() {
    
    $("#promptModal").modal('hide');
    $scope.finishFunc($scope.userResponse);
    
  };
  
  
  
}]);
