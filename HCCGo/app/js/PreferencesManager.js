

preferencesModule = angular.module('PreferencesManager', [])

preferencesModule.factory('preferencesManager',['$log', '$q','filePathService','dbService', function($log, $q, filePathService, dbService) {
  
  var clustersDefer;
  var preferencesDefer;
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

    // 

    readPrefDefer = $q.defer();
    preferencesDefer = readPrefDefer.promise;
    
    var preferences;
    fs.exists(preferencePath, function(exists) {
      if(!exists) {
        ws = fs.createWriteStream(preferencePath);
        var uuid = require('uuid');
        var buffer = new Array(16);
        buffer = uuid(null,buffer,0);
 	      var obj = { uuid :  uuid.unparse(buffer) };
        ws.write(JSON.stringify(obj));
        readPrefDefer.resolve(obj);
        ws.end();
      }
      else {
        fs.readFile(preferencePath, function(err, data) {
	      preferences = JSON.parse(data);
        readPrefDefer.resolve(preferences);
	      })
	    }
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
    var returnDefer3 = $q.defer()
    preferencesDefer.then(function(preferences) {
      fs.readFile(preferencePath, function(err, data) {
	    if(err) {
          $log.error(err);
          returnDefer3.reject(err);
      }
	    else {
	    var curPreferences = JSON.parse(data);
	    for(i in preference) {
	    curPreferences[i] = preference[i];
	    }
      var sw = fs.createWriteStream(preferencePath);

	    sw.write(JSON.stringify(curPreferences));
      returnDefer3.resolve(curPreferences);
      sw.end();
      }
      })
    })
	  return returnDefer3.promise;
    
  }
  
  init();

    return {
      getClusters: getClusters,
      setClusters: setClusters,
      addCluster: addCluster,
      
      getPreferences: getPreferences,
      setPreferences: setPreferences
      
    }
}]);
  
