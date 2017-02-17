tutorialModule = angular.module('HccGoApp.tutorialCtrl', ['ngRoute' ]);

tutorialModule.controller('tutorialCtrl', ['$scope', '$log', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', function($scope, $log, $routeParams, $location, $q, preferencesManager, notifierService) {
  
  
  
  
  var init = function() {
    
    preferencesManager.getTutorials().then(function(jsonTutorials) {
      $scope.tutorials = jsonTutorials.tutorials;
      
      
    }, function(err) {
      // Error getting the tutorials
      
    });
  };
    
    // Get the tutorials

  
  
  
  init();
  
}]);