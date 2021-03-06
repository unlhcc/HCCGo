tutorialModule = angular.module('HccGoApp.tutorialCtrl', ['ngRoute' ]);



/**
 * Controller for the tutorials page.
 * @class tutorialCtrl
 * @service
 *
 */
tutorialModule.controller('tutorialCtrl', ['$scope', '$log', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', '$http', 'connectionService', '$timeout', 'jobService', 'analyticsService', function($scope, $log, $routeParams, $location, $q, preferencesManager, notifierService, $http, connectionService, $timeout, jobService, analyticsService) {

  const async = require("async");
  const escape = require("escape-html");
  var init = function() {
    $(".download-json").addClass("loading");
    preferencesManager.getTutorials().then(function(jsonTutorials) {
      $scope.tutorials = jsonTutorials.tutorials;

      getRepoConfigurations(jsonTutorials.tutorials);

      $timeout(() => $(".download-json").removeClass("loading"), 500);
    }, function(err) {
      // Error getting the tutorials
      if (err) {
        notifierService.error("Problem reading tutorial file!", "Error");
        $(".download-json").removeClass("loading");
      }

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
        tutorial.labels = packagedetails.tags;
        tutorial.postInstall = packagedetails.postInstall;
        tutorial.error = null;
        tutorial.progress = 0;
      }, function(err) {
        // If there was an error getting the details
        tutorial.error = err;
      });

    });


  }

  $scope.click = function(tutorial) {
    jobService.getDBJobs().then(function(jobs) {
      // LOGIC HERE FOR CHECKING IF REPO HAS ALREADY BEEN DOWNLOADED
    });
    async.series([
      function(callback) {
        tutorial.progress = 25;
        console.log(tutorial.progress);
        $('#submitprogress').css('width', tutorial.progress+'%').attr('aria-valuenow', tutorial.progress);
        tutorial.progressMessage = "Clone to cluster...";


        // Run the git clone
        connectionService.runCommand("cd $WORK; git clone " + tutorial.gitrepo ).then(function(data){
          analyticsService.event("tutorial clone", tutorial.name, tutorial.version);
          callback(null);
        }, function(err) {
          callback(err);
        });
      },

      // Run the tutorials commands
      function(callback) {
        tutorial.progress = 50;
        $('#submitprogress').css('width', tutorial.progress+'%').attr('aria-valuenow', tutorial.progress);
        tutorial.progressMessage = "Run Post Install Commands...";
        if ( !tutorial.hasOwnProperty('postInstall') || tutorial.postInstall == undefined || tutorial.postInstall.length < 1) {
          return callback(null);
        }
        var single_command = tutorial.postInstall.join(';');
        connectionService.runCommand(single_command).then(function(data) {
          callback(null);
        }, function(err) {
          callback(err);
        });

      },

      function(callback) {
        tutorial.progress = 75;
        console.log(tutorial.progress);
        $('#submitprogress').css('width', tutorial.progress+'%').attr('aria-valuenow', tutorial.progress);
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

        tutorial.progress = 100;
        console.log(tutorial.progress);
        $('#submitprogress').css('width', tutorial.progress+'%').attr('aria-valuenow', tutorial.progress);
        tutorial.progressMessage = "Done!";

        notifierService.success(tutorial.submits.length + " Jobs imported into Submission DB", "Tutorial Succesfully Imported");
        $timeout(function() {
          tutorial.progress = 0;
        }, 2000);

      }
    );
  }

  /**
   * Import the submission scripts from the package.json
   * @memberof tutorialCtrl
   * @param {Array} submits Array of submission files
   */
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

    var toReturn = $q.defer();
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

  function sanitizeJSON(unsanitized){
    return unsanitized.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/\f/g, "\\f").replace(/"/g,"\\\"").replace(/'/g,"\\\'").replace(/\&/g, "\\&");
  }
}]);
