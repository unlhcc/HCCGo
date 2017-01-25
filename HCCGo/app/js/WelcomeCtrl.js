
welcomeModule = angular.module('HccGoApp.WelcomeCtrl', [ ]);

welcomeModule.controller('welcomeCtrl', ['$scope', '$log', '$timeout', 'connectionService', 'notifierService', '$location', 'preferencesManager', 'updaterService', function($scope, $log, $timeout, connectionService, notifierService, $location, preferencesManager, updaterService) {
 
  updaterService.start();
  angular.element('#betaModal').modal('show');
  
  $('#betaModal').on('shown.bs.modal', function () {
  // get the locator for an input in your modal. Here I'm focusing on
  // the element with the id of myInput
  $('#focusOn').focus()
});
  $('#focusOn').on('click', function() {
    $('#newFocus').focus()
  });
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
    var curValue = 33;
    $scope.selectedCluster = $.grep($scope.clusters, function(e) {return e.url == connectUrl})[0];
    
    
    $('#submitprogress').css('width', curValue+'%').attr('aria-valuenow', curValue);

    $log.log("Got " + $scope.username + " for login");
    
    curValue = 66;
    $('#submitprogress').css('width', curValue+'%').attr('aria-valuenow', curValue);

    $log.log("Starting login process", 'warning');
    
    connectionService.initiateConnection($scope.username, $scope.password, connectUrl, $scope.selectedCluster.label, this.logger, userPrompt,  function(err) {
      $scope.$apply(function() {
        
        if (err) {
          $log.error("Got error from connection");
          $('#loginSubmit').prop('disabled', false);
          $('#loginForm').fadeTo('fast', 1.0);
          curValue = 0;
          $('#submitprogress').css('width', curValue+'%').attr('aria-valuenow', curValue);
        } else {
          curValue = 100;
          $('#submitprogress').css('width', curValue+'%').attr('aria-valuenow', curValue);
          $location.path("/cluster/" + $scope.selectedCluster.label);
          $log.debug("Cluster label: " + $scope.selectedCluster.label);
          
        }      
      });
    });
  };
  
  $scope.transformCustom = function(customUrl) {
    
    $log.log("Got custom attribute: " + customUrl);
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
