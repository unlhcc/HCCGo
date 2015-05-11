
clusterLandingModule = angular.module('HccGoApp.clusterLandingCtrl', ['ngRoute' ]);

clusterLandingModule.controller('clusterLandingCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager) {
  
  $scope.params = $routeParams
  var clusterInterface = null;
  
  
  $scope.logout = function() {
    
    
    
    
    $location.path("/");
    
  }
  
  
  function getClusterStats(clusterId) {
    
    // Query the connection service for the cluster
    clusterInterface.getJobs().then(function(data) {
      // Process the data
      
      $scope.numRunning = data.numRunning;
      $scope.numIdle = data.numIdle;
      $scope.jobs = data.jobs;
      

            
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
  preferencesManager.getClusters().then(function(clusters) {
    // Get the cluster type
    var clusterType = $.grep(clusters, function(e) {return e.label == $scope.params.clusterId})[0].type;
    
    switch (clusterType) {
      case "slurm":
        clusterInterface = new SlurmClusterInterface(connectionService, $q);
        break;
      case "condor":
        clusterInterface = new CondorClusterInterface(connectionService, $q);
        break;
    }
    
    getClusterStats($scope.params.clusterId);
    
  })
  
  
}]);
