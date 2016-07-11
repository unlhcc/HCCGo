

preferencesModule = angular.module('PreferencesManager', [])

preferencesModule.factory('preferencesManager',['$log', '$q', function($log, $q) {
  
  var clustersDefer;
  
  var init = function() {
    // Read in the clusters file
    readClustersDefer = $q.defer();
    clustersDefer = readClustersDefer.promise;
    var fs = require("fs");
    var path = require("path");
    var clusters = path.join(__dirname, 'data/clusters.json');
    fs.readFile(clusters, function(err, data) {
      if(err) {
        $log.error(err);
        readClustersDefer.reject(err);
      }
      
      clusters = JSON.parse(data);
      readClustersDefer.resolve(clusters.clusters);
      
    })
    
    
    
    console.log("Current Directory = " + process.cwd());
    fs = require("fs");
    console.log(fs.readdirSync(process.cwd()));
    
    
    
  }
  
  
  
  var getClusters = function() {
    var returnDefer = $q.defer();
    clustersDefer.then(function(clusters) {
      returnDefer.resolve(clusters);
    })
    
    return returnDefer.promise;
    
  }
  
  var setClusters = function(clusters) {
    
    
  }
  
  var addCluster = function(cluster) {
    
  }
  
  
  init();
    return {
      getClusters: getClusters,
      setClusters: setClusters,
      addCluster: addCluster
      
    }
}]);
  
