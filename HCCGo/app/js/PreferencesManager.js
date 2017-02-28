

preferencesModule = angular.module('PreferencesManager', [])

preferencesModule.factory('preferencesManager',['$log', '$q', 'filePathService', function($log, $q, filePathService) {
  
  var clustersDefer;
  var preferencesDefer;
  var preferencePath = filePathService.getPreferencePath();
  var fs = require("fs");
  
  /**
     * Initializes and reads preferences.json and reads clusters.json, resolves promises for method execution
     * @method init
     * @memberof PreferencesManager
     */
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
    
    
    // Initialize the file and id if not initialized
    readPrefDefer = $q.defer();
    preferencesDefer = readPrefDefer.promise;
    var preferences;
    fs.exists(preferencePath, function(exists) {
      if(!exists) {
        ws = fs.createWriteStream(preferencePath);
        var uuid = require('uuid');       
        var obj = { uuid : uuid(null,0) };
        ws.write(JSON.stringify(obj));
        readPrefDefer.resolve(obj);
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
   * Get the array of tutorials in the tutorials.json file
   * This file is distributed with the Application.
   * @method getTutorials
   * @memberof PreferencesManager
   * @returns {Promise.<object>}
   */
  var getTutorials = function() {
    var toReturn = $q.defer();
    
    // Get the path to the tutorials file
    var path = require("path");
    var tutorials = path.join(__dirname, 'data/tutorials.json');
    
    // Read in the tutorials file
    fs.readFile(tutorials, function(err, data) {
      if (err) {
        return toReturn.reject(err);
      }
      
      return toReturn.resolve(JSON.parse(data));
    })

    
    return toReturn.promise;
  }
  
  /**
     * Get the currently set preferences
     * @method getPreferences
     * @memberof PreferencesManager
     * @returns {Promise.<object>}
     */
  var getPreferences = function() {
    var returnDefer = $q.defer();
    preferencesDefer.then(function(preferences) {
	  returnDefer.resolve(preferences);
    })
    return returnDefer.promise;
  }
  /**
     * Sets 1 or more preferences
     * @method getPreferences
     * @memberof PreferencesManager
     * @param {object} preferences - An object with 1 or more preference pairs
     * @returns {Promise.<object>}
     */
  var setPreferences = function(preference) {
    var returnDefer = $q.defer();
    preferencesDefer.then(function(preferences) {
      fs.readFile(preferencePath, function(err, data) {
        if(err) {
          $log.error(err);
          returnDefer.reject(err);
        }
        else {
          var curPreferences = JSON.parse(data);
          for(i in preference) {
          curPreferences[i] = preference[i];
        }
        var sw = fs.createWriteStream(preferencePath);
        sw.write(JSON.stringify(curPreferences));
        returnDefer.resolve(curPreferences);
        }
      })
    })
    return returnDefer.promise;
  }
  
  init();
    return {
      getClusters: getClusters,
      setClusters: setClusters,
      addCluster: addCluster,
      getPreferences: getPreferences,
      setPreferences: setPreferences,
      getTutorials: getTutorials
      
    }
}]);
  
