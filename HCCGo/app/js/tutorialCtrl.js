tutorialModule = angular.module('HccGoApp.tutorialCtrl', ['ngRoute' ]);



/**
 * Controller for the tutorials page.
 * @class tutorialCtrl
 * @service 
 *
 */
tutorialModule.controller('tutorialCtrl', ['$scope', '$log', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', '$http', 'connectionService', '$timeout', function($scope, $log, $routeParams, $location, $q, preferencesManager, notifierService, $http, connectionService, $timeout) {
  
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
        
        $timeout(function() {
          callback(null);
        }, 1000);

        // Import job submissions
      }],
    
      function(err, results) {
        if (err) {
          tutorial.error = err;
        }
        
        tutorial.progess = 100;
        tutorial.progressMessage = "Done!";
          
        $timeout(function() {
          tutorial.progress = 0;
        }, 2000);
          
      }
    );
    
    
    
  }
  
  /**
   * Get the `package.json` file from the github repo to fill in details.
   * Retrives the package using the `raw.githubusercontent.com` raw link.
   * @tutorial writing-tutorials
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