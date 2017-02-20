tutorialModule = angular.module('HccGoApp.tutorialCtrl', ['ngRoute' ]);



/**
 * Controller for the tutorials page.
 * @class tutorialCtrl
 * @service 
 *
 */
tutorialModule.controller('tutorialCtrl', ['$scope', '$log', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', '$http', 'connectionService', '$timeout', 'jobService', function($scope, $log, $routeParams, $location, $q, preferencesManager, notifierService, $http, connectionService, $timeout, jobService) {
  
  const async = require("async");
  
  var init = function() {
    
    preferencesManager.getTutorials().then(function(jsonTutorials) {
      $scope.tutorials = jsonTutorials.tutorials;
      
      getRepoConfigurations(jsonTutorials.tutorials);
      
      
    }, function(err) {
      // Error getting the tutorials
      
    });
  };
    
    // Get the tutorials

  
  var getRepoConfigurations = function(tutorials) {
    
    // For each tutorials
    async.each(tutorials, function(tutorial) {
      getPackageJson(tutorial.user, tutorial.repo).then(function(packagedetails){
        tutorial.name = packagedetails.name;
        tutorial.version = packagedetails.version;
        tutorial.description = packagedetails.description;
        tutorial.submits = packagedetails.submits;
        tutorial.error = null;
      }, function(err) {
        // If there was an error getting the details
        tutorial.error = err;
      });

    });
    
    
  }
  
  $scope.click = function(tutorial) {
    
    async.series([
      function(callback) {
        tutorial.progress = 33;
        tutorial.progressMessage = "Clone to cluster...";
        
        // Run the git clone
        connectionService.runCommand("cd $WORK; git clone " + tutorial.gitrepo ).then(function(data){
          callback(null);
        }, function(err) {
          callback(err);
        });
      },
      
      function(callback) {  
        tutorial.progress = 66;
        tutorial.progressMessage = "Importing job submissions...";
        importSubmitScripts(tutorial.submits).then(function() {
          callback(null);
        }, function(err) {
          callback(err);
        });
        
        

        // Import job submissions
      }],
    
      function(err, results) {
        if (err) {
          tutorial.error = err;
        }
        
        tutorial.progess = 100;
        tutorial.progressMessage = "Done!";
        
        notifierService.success(tutorial.submits.length + " Jobs imported into Submission DB", "Tutorial Succesfully Imported");
        $timeout(function() {
          tutorial.progress = 0;
        }, 2000);
          
      }
    );
    
    
    
  }
  
  var importSubmitScripts = function(submits) {
    var toReturn = $q.defer();
    
    async.each(submits, function(submit_script, callback) {
      jobService.addDBJob(submit_script).then(function() {
        callback();
      }, function(err) {
        callback(err);
      });
    }, function(err) {
      if (err) return toReturn.reject(err);
      return toReturn.resolve();
    });
    
    return toReturn.promise;
    
  }
  
  
  /**
   * Get the `package.json` file from the github repo to fill in details.
   * Retrives the package using the `raw.githubusercontent.com` raw link.
   * @tutorial writing-tutorials
   * @param {String} user Username of github repo
   * @param {String} repo Repository name on Github
   * @memberof tutorialCtrl
   */
  var getPackageJson = function(user, repo) {
    
    toReturn = $q.defer();
    url = "https://raw.githubusercontent.com/" + user + "/" + repo + "/master/package.json";
    
    $http.get(url).
      success(function(data, status, headers, config) {
        toReturn.resolve(data);
        
      }).error(function(data, status, headers, config) {
        toReturn.reject("Failed to get package.json");
        
      });
      
    return toReturn.promise;
  }
  
  
  
  init();
  
}]);