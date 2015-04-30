
clusterLandingModule = angular.module('HccGoApp.clusterLandingCtrl', ['ngRoute' ]);

clusterLandingModule.controller('clusterLandingCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q) {
  
  $scope.params = $routeParams
  var clusterInterface = new SlurmClusterInterface(connectionService, $q);
  
  $scope.logout = function() {
    
    
    
    
    $location.path("/");
    
  }
  
  
  function getClusterStats(clusterId) {
    
    // Query the connection service for the cluster
    clusterInterface.getJobs().then(function(data) {
      // Process the data
      
      $scope.numRunning = data.numRunning;
      $scope.numIdle = data.numIdle;
      

            
    }, function(error) {
      console.log("Error in CTRL: " + error);
    })
    
    
  }
  
  // Get the username
  function getUsername() {
    
    connectionService.getUsername().then(function(username) {
      $scope.username = username;
    })
    
  }
  
  getUsername();
  getClusterStats($scope.params.clusterId);
  
}]);
