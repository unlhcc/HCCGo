
clusterLandingModule = angular.module('HccGoApp.clusterLandingCtrl', ['ngRoute' ]);

clusterLandingModule.controller('clusterLandingCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'filePathService', 'notifierService', 'dbService', 'dataUsageService', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, filePathService, notifierService, dbService, dataUsageService) {

  $scope.params = $routeParams;
  $scope.jobs = [];
  var clusterInterface = null;
  var path = require('path');
  var jobHistory = path.join(__dirname, 'data/jobHistory.json');

  // Check if app data folder is there, if not, create one with default json file
  var jobHistoryPath = filePathService.getJobHistory();
  var dataPath = filePathService.getDataPath();
  var submittedJobsPath = filePathService.getSubmittedJobs();
  var db;
  var fs = require('fs');
  fs.exists(dataPath, function(exists) {
    if(!exists) {
        fs.mkdir(dataPath, function() {
            // create default files
            fs.createWriteStream(jobHistoryPath);
            var jobHistoryDB = dbService.getJobHistoryDB();
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
          var jobHistoryDB = dbService.getJobHistoryDB();
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
  db = dbService.getSubmittedJobsDB();

  // Generate empty graphs
  var homeUsageGauge = c3.generate({
    bindto: '#homeUsageGauge',
    data: {
      columns: [
        ['Used', 0]
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
        ['Used', 0]
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
    //var jobList = [];
    async = require("async");
    // Get completed jobs from db file

    async.parallel([

      // Query all the uncompleted jobs in the DB
      function(callback) {
        db.find({complete: false, cluster: $scope.params.clusterId}, function (err, docs) {

          if (err) {
            $log.err("Error querying the DB for job states");
            return callback("Error querying the DB for job states");
          }

          return callback(null, docs);
        });
      },

      function(callback) {
        db.find({complete: true, cluster: $scope.params.clusterId}, function (err, docs) {
          if (err) {
            $log.err("Error querying the DB for job states");
            return callback("Error querying the DB for job states");
          }
          return callback(null, docs);

        });
      },

      // Query for all of the jobs that are not completed:
      function(callback) {
        clusterInterface.getJobs().then(function(data) {

          return callback(null, data);
        });

      }],
      // Here is where we combine the results from the DB and the getting of jobs
      function(err, results) {

        // results[0] is jobs from the DB that have not completed
        // results[1] is jobs completed in the DB
        // results[2] is jobs from the cluster
        var completed_jobs = results[1];
        var db_jobs = results[0];
        var cluster_jobs = results[2].jobs;

        // Find jobs that are in the DB but not reported (recently completed jobs)
        for (var index = 0; index < db_jobs.length; index++) {
          curJob = db_jobs[index];
          for (var indexa = 0; indexa < cluster_jobs.length; indexa++) {
            if (curJob.jobId == cluster_jobs[indexa].jobId) {
              // Remove the job from the list of jobs we care about
              db_jobs.splice(index, 1);

              // Break out of this inner for loop
              break;
            }
          }
        }

        // Now, db_jobs are jobs that are in the DB as running, but
        // not in the list of running or idle jobs.  So they must
        // have completed

        // Update the DB
        async.series([
          function(callback) {
            if (db_jobs.length < 1) {
              return callback(null, null);
            }
            clusterInterface.getCompletedJobs(db_jobs).then(
              function(jobs) {

                $log.debug("Got " + jobs.length + " completed jobs");
                var recent_completed = [];
                async.each(jobs, function(job, each_callback) {

                  $log.debug(job);
                  db.update(
                    { _id: job._id },
                    { $set:
                      {
                      "complete": true,
                      "elapsed": job.Elapsed,
                      "reqMem": job.ReqMem,
                      "jobName": job.JobName
                      }
                    },
                    { returnUpdatedDocs: true },
                    function (err, numReplaced, affectedDocuments) {
                      // update db with data so it doesn't have to be queried again
                      if (!err) {
                        notifierService.success('Your job, ' + affectedDocuments.jobName + ', has been completed', 'Job Completed!');
                        $log.debug("Completed job is: " + affectedDocuments);

                        recent_completed.push(affectedDocuments);
                        return each_callback(null);

                      }
                    }
                  );
                }, function(err) {
                  // After the for loop, return all of the recently completed jobs.
                  return callback(null, recent_completed);

                });


              }
            , function(msg) {
              $log.debug("No jobs returned by completed job");
              return callback(null, null);
            });

          }
        ],
        function(err, recent_completed) {
          $scope.numRunning = results[2].numRunning;
          $scope.numIdle = results[2].numIdle;
          $scope.numError = results[2].numError;
          $log.debug("Concat all the things!");
          // Ok, now concat everything together.  Running jobs, completed jobs, and recently completed jobs.
          if (recent_completed[0] == null) {
            $scope.jobs = completed_jobs.concat(cluster_jobs);
          } else {
            $scope.jobs = recent_completed[0].concat(completed_jobs, cluster_jobs);
          }


        });

      }
    );




    // Make sure the jobs data is always shown

    dataUsageService.getDataUsage(clusterInterface).then(function(data) {
      
      homeUsageGauge.load({
          columns: [
            ['Used', data[0].blocksUsed]
          ]
      });

      // POSSIBLE FUTURE DEPRECATION: Messing with interals instead of using load function
      homeUsageGauge.internal.config.gauge_units = 'Gigabytes';
      homeUsageGauge.internal.config.gauge_max = data[0].blocksQuota;

      workUsageGauge.load({
          columns: [
            ['Used', data[1].blocksUsed]
          ]
      });

      // POSSIBLE FUTURE DEPRECATION: Messing with interals instead of using load function
      workUsageGauge.internal.config.gauge_units = 'Gigabytes';
      workUsageGauge.internal.config.gauge_max = data[1].blocksLimit;
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
        refreshingPromise = $timeout(refreshEvery,30000)
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
