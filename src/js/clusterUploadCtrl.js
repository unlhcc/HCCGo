
clusterUploadModule = angular.module('HccGoApp.clusterUploadCtrl', ['ngRoute', 'ui.bootstrap' ]);

clusterUploadModule.controller('clusterUploadCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager) {
  
  $scope.params = $routeParams
  var clusterInterface = null;
  
  $scope.logout = function() {
    connectionService.closeStream();
    $location.path("/");
    
  }
  
  // Sets the name of the file to upload in the declaration box
  $scope.setFiles = function(element) {
	$scope.$apply(function(scope) {
		$log.debug('File set: ' + element.files);
		$log.debug('Number of files: ' + element.files.length);
		$scope.files = [];
		for (var i = 0; i < element.files.length; i++) {
			$scope.files.push(element.files[i]);
		}
		$scope.progressVisible = false;
	})
  }
  
  // Uploads files through SFTPStream
  $scope.uploadFile = function() {
	
	// Let's do some debugging
	var index = 0;
	var file = $scope.files[index];
	console.log("Value of file.name: " + file.name);
	console.log("Value of file.path: " + file.path);
	
	// Runs file upload
	connectionService.uploadFile(file.path, file.name, function(total_transferred,chunk,total){
		// Callback function for progress bar
		$log.debug("Total transferred: " + total_transferred);
		$log.debug("Chunks: " + chunk);
		$log.debug("Total: " + total);
		
		// Work on progress bar
		$scope.$apply(function(scope) {
			$scope.max = total;
			$scope.countFrom = 0;
			$scope.countTo = total;
			$scope.progressValue = total_transferred;
		});
		
		}).then(function (data) {
		// Do nothing for now
		
		});
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
