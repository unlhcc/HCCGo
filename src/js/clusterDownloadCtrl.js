
clusterDownloadModule = angular.module('HccGoApp.clusterDownloadCtrl', ['ngRoute' ]);

clusterDownloadModule.controller('clusterDownloadCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager) {
  
  $scope.params = $routeParams
  var clusterInterface = null;
  
  
  $scope.logout = function() {
    
    $location.path("/");
    
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
