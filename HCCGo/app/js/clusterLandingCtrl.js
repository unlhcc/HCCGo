
clusterLandingModule = angular.module('HccGoApp.clusterLandingCtrl', ['ngRoute' ]);

clusterLandingModule.controller('clusterLandingCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'filePathService', 'notifierService', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, filePathService, notifierService) {

  $scope.params = $routeParams;
  $scope.jobs = [];
  var clusterInterface = null;
  var path = require('path');
  var jobHistory = path.join(__dirname, 'data/jobHistory.json');
  // nedb datastore
  const DataStore = require('nedb');

  // Check if app data folder is there, if not, create one with default json file
  var jobHistoryPath = filePathService.getJobHistory();
  var dataPath = filePathService.getDataPath();
  var submittedJobsPath = filePathService.getSubmittedJobs();

  var fs = require('fs');
  fs.exists(dataPath, function(exists) {
    if(!exists) {
        fs.mkdir(dataPath, function() {
            // create default files
            fs.createWriteStream(jobHistoryPath);
            var jobHistoryDB = new DataStore({ filename: jobHistoryPath, autoload:true });
            $.getJSON(jobHistory, function(json) {
              jobHistoryDB.insert(json.jobs[0], function(err, newDoc) {
                if(err) console.log(err);
              });
            });
            fs.createWriteStream(submittedJobsPath);
        });
    }
    else {
      fs.exists(jobHistoryPath, function(fileExists) {
        if(!fileExists) {
          fs.createWriteStream(jobHistoryPath);
          var jobHistoryDB = new DataStore({ filename: jobHistoryPath, autoload:true });
          $.getJSON(jobHistory, function(json) {
            jobHistoryDB.insert(json.jobs[0], function(err, newDoc) {
              if(err) console.log(err);
            });
          });
        }
      });
      fs.exists(submittedJobsPath, function(fileExists) {
        if(!fileExists)
          fs.createWriteStream(submittedJobsPath);
      });
    }
  });

  var db = new DataStore({ filename: submittedJobsPath, autoload: true });

  // Generate empty graphs
  var homeUsageGauge = c3.generate({
    bindto: '#homeUsageGauge',
    data: {
      columns: [
        ['Loading', 0]
      ],
      type: 'gauge'
    },
    gauge: {
      units: 'Loading',
      label: {
        format: function(value, ratio) {
            return value.toFixed(2);
        }
      },
      max: 0,

    },
    color: {
      pattern: [ '#60B044', '#F6C600', '#F97600', '#FF0000' ],
      threshold: {
        values: [30, 60, 90, 100]
      }
    },
    size: {
      height: 180
    }

  });

  var workUsageGauge = c3.generate({
    bindto: '#workUsageGauge',
    data: {
      columns: [
        ['Loading', 0]
      ],
      type: 'gauge'
    },
    gauge: {
      units: 'Loading',
      label: {
        format: function(value, ratio) {
            return value.toFixed(2);
        }
      },
      max: 0,

    },
    color: {
      pattern: [ '#60B044', '#F6C600', '#F97600', '#FF0000' ],
      threshold: {
        values: [30, 60, 90, 100]
      }
    },
    size: {
      height: 180
    }

  });


  $scope.refreshCluster = function() {
    getClusterStats($scope.params.clusterId);

  }

  $scope.removeCompletedJob = function(index) {
    // deletes the document from db and removes it from list
    var job = $scope.jobs[index];
    $scope.jobs.splice(index,1);
    db.remove({ _id: job._id }, { multi: true }, function (err, numRemoved) {
      if(err) console.log("Error deleting document " + err);
    });
  }

  function getClusterStats(clusterId) {

    // Begin spinning the refresh image
    $(".mdi-action-autorenew").addClass("spinning-image");

    // Array to concat together running and completed jobs
    var jobList = [];

    // Get completed jobs from db file
    db.find({ loaded: true }, function (err, docs) {
      // if data already loaded, just add them to the list
      jobList = jobList.concat(docs);
      if(err) console.log("Error fetching completed jobs: " + err);
    });

    db.find({ loaded: false }, function (err, docs) {
        // if they are newly completed jobs, fetch the data
      if (docs.length > 0) {
        clusterInterface.getCompletedJobs(docs).then(function(data) {
          for (var i = 0; i < data.length; i++) {
            console.log(data[i]);
            db.update(
              { _id: data[i]._id },
              { $set:
                {
                "loaded": true,
                "complete": true,
                "elapsed": data[i].Elapsed,
                "reqMem": data[i].ReqMem,
                "jobName": data[i].JobName
                }
              },
              { returnUpdatedDocs: true },
              function (err, numReplaced, affectedDocuments) {
                // update db with data so it doesn't have to be queried again
                if (!err) {
                  notifierService.success('Your job, ' + affectedDocuments.jobName + ', has been completed', 'Job Completed!');
                  jobList = jobList.concat(affectedDocuments);
                }
              }
            );
          }
        });
      }
      if(err) console.log("Error fetching completed jobs: " + err);
    });

    // Query the connection service for the cluster
    clusterInterface.getJobs().then(function(data) {
      // Process the data

      $scope.numRunning = data.numRunning;
      $scope.numIdle = data.numIdle;
      $scope.numError = data.numError;
      $scope.jobs = data.jobs.concat(jobList);

      $(".mdi-action-autorenew").removeClass("spinning-image");

    }, function(error) {
      console.log("Error in CTRL: " + error);
    })

    clusterInterface.getStorageInfo().then(function(data) {


      var homeUsageGauge = c3.generate({
        bindto: '#homeUsageGauge',
        data: {
          columns: [
            ['Used', data[0].blocksUsed]
          ],
          type: 'gauge'
        },
        gauge: {
          units: 'Gigabytes',
          label: {
            format: function(value, ratio) {
                return value.toFixed(2);
            }
          },
          max: data[0].blocksQuota,

        },
        color: {
          pattern: [ '#60B044', '#F6C600', '#F97600', '#FF0000' ],
          threshold: {
            values: [30, 60, 90, 100]
          }
        },
        size: {
          height: 180
        }

      });

      var workUsageGauge = c3.generate({
        bindto: '#workUsageGauge',
        data: {
          columns: [
            ['Used', data[1].blocksUsed]
          ],
          type: 'gauge'
        },
        gauge: {
          units: 'Gigabytes',
          label: {
            format: function(value, ratio) {
                return value.toFixed(2);
            }
          },
          max: data[1].blocksLimit,

        },
        color: {
          pattern: [ '#60B044', '#F6C600', '#F97600', '#FF0000' ],
          threshold: {
            values: [30, 60, 90, 100]
          }
        },
        size: {
          height: 180
        }

      });

    });


  }

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

    // Update the cluster every 15 seconds
    var refreshingPromise;
    var isRefreshing = false;
    $scope.startRefreshing = function(){
      if(isRefreshing) return;
      isRefreshing = true;
      (function refreshEvery(){
        //Do refresh
        getClusterStats($scope.params.clusterId);
        //If async in then in callback do...
        refreshingPromise = $timeout(refreshEvery,15000)
      }());
    };
    $scope.$on('$destroy',function(){
      if(refreshingPromise) {
        $timeout.cancel(refreshingPromise);
      }
    });

    $scope.startRefreshing();
  })


}]);
