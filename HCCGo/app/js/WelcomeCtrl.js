
welcomeModule = angular.module('HccGoApp.WelcomeCtrl', [ ]);

welcomeModule.controller('welcomeCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$location', 'preferencesManager', function($scope, $log, $timeout, connectionService, $location, preferencesManager) {
  
  var $selector = $('#clusterSelect').selectize({
    
    createOnBlur: true,
    labelField: 'label',
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
  
  preferencesManager.getClusters().then(function(clusters) {
    $scope.clusters = clusters;
    selection.addOption(clusters);
    selection.addItem(clusters[0].url, false);
    selection.refreshOptions(false);
    selection.refreshItems();
  });
  

  
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
    
    connectionService.initiateConnection($scope.username, $scope.password, connectUrl, $scope.selectedCluster.label, this.logger, userPrompt,  function(err) {
      $scope.$apply(function() {
        
        if (err) {
          logger.error("Got error from connection");
          $('#loginSubmit').prop('disabled', false);
          $('#loginForm').fadeTo('fast', 1.0);
        } else {
          
          $location.path("/cluster/" + $scope.selectedCluster.label);
        $log.debug("Cluster label: " + $scope.selectedCluster.label);
          
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
      
      // Event registration must be before show command
      $('#promptModal').on('shown.bs.modal', function () {
        $('#userPromptInput').focus();
      });
      $("#promptModal").modal('show');

      $scope.finishFunc = finishFunc;
    });
    
  };
  
  $scope.promptComplete = function() {
    
    $("#promptModal").modal('hide');
    $scope.finishFunc($scope.userResponse);
    
  };
  
}]);
