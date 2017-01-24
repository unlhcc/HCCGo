

preferencesModule = angular.module('PreferencesManager', [])

preferencesModule.factory('preferencesManager',['$log', '$q','filePathService','dbService', function($log, $q, filePathService, dbService) {
  
  var clustersDefer;
  var preferencesDefer;
  var jsonfile = require('jsonfile');
  var preferencePath = filePathService.getPreferencePath();
  var fs = require("fs");

  var init = function() {
    // Read in the clusters file
    readClustersDefer = $q.defer();
    clustersDefer = readClustersDefer.promise;
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
    console.log(fs.readdirSync(process.cwd()));

    // Read in preferences file

    readPrefDefer = $q.defer();
    preferencesDefer = readPrefDefer.promise;
    
    var preferences;

    fs.readFile(preferencePath, function(err, data) {
	if(err) {
	$log.error(err);
        readPrefDefer.reject(err);
	}
    
	preferences = JSON.parse(data);
        
	if(!preferences['uuid']) {
	    //console.log("uuid not set!");
            var uuid = require('uuid');
            var buffer = new Array(16);
            buffer = uuid(null,buffer,0);
 	    var obj = { uuid :  uuid.unparse(buffer) };
            jsonfile.writeFile(preferencePath, obj, function(err) {
		//$log.error(err);
	    });
        }
       
	readPrefDefer.resolve(preferences.preferences);
	

    })
	
        
    
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
  /**
     * Get the currently set preferences
     * @method getPreferences
     * @memberof PreferencesManager
     * @returns javascript object.
     */
  var getPreferences = function() {
    var returnDefer2 = $q.defer();
    preferencesDefer.then(function(preferences) {
	returnDefer2.resolve(preferences);
    })
    return returnDefer2.promise;
  }
  /**
     * Sets 1 or more preferences
     * @method getPreferences
     * @memberof PreferencesManager
     * @param {object} preferences - An object with 1 or more preference pairs
     */
  var setPreferences = function(preference) {
    fs.readFile(preferencePath, function(err, data) {
	if(err) {
          $log.error(err);
        }
	else {
	  var curPreferences = JSON.parse(data);
	  for(i in preference) {
	  curPreferences[i] = preference[i];
	  }
          //console.log(curPreferences);
          //console.log(JSON.stringify(curPreferences));
	  fs.writeFile(preferencePath, JSON.stringify(curPreferences), function(err) {
	  $log.error(err);
	  });
        }
	
    });
	 
    
  }
  
  init();
  var obj1 = { 'test 1': '5','test2': '10'};
  //console.log(obj1);
  setPreferences(obj1);
    return {
      getClusters: getClusters,
      setClusters: setClusters,
      addCluster: addCluster,
      
      getPreferences: getPreferences,
      setPreferences: setPreferences
      
    }
}]);
  
