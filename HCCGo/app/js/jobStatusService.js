jobStatusService = angular.module('jobStatusService', []);

/**
 * The jobStatusService allows for periodic loading of the status of jobs that comes from the clusters.
 *
 * A Promise with the data is returned, which is then set properly within the controller
 *
 * @ngdoc service
 * @memberof HCCGo
 * @class jobStatusService
 */
jobStatusService.service('jobStatusService',['$log','$q','notifierService', function($log, $q, notifierService) {
	var async = require('async');
	var oldData = null;
	var lastRequestedTime = 0;
	return {

	  /**
     * Makes asynchronous calls to check for job statuses within the database
     * @method refreshDatabase
     * @memberof HCCGo.jobStatusService
     * @param {DataStore} db - Database used for querying job status
     * @param {GenericClusterInterface} clusterInterface - Used to grab uncompleted jobs from the cluster
     * @param {integer} clusterId - Unique ID of the cluster for querying the database
     * @param {boolean} force - Flag denoting if the user wants to force update the database
     * @returns {Promise} Promise object to be resolved in the controller
     */
		refreshDatabase: function(db, clusterInterface, clusterId, force=false) {
			var toReturn = $q.defer();

			// Reloads old data if it's been less than 15 seconds and the user hasn't forced an update
			if (Date.now() - lastRequestedTime < 15000 && !force){
				lastRequestedTime = Date.now()
				toReturn.resolve(oldData);
			}
			else {
			async.parallel([

		      // Query all the uncompleted jobs in the DB
		      function(callback) {
		        db.find({complete: false, cluster: clusterId}, function (err, docs) {

		          if (err) {
		            $log.err("Error querying the DB for job states");
		            return callback("Error querying the DB for job states");
		          }

		          return callback(null, docs);
		        });
		      },

		      function(callback) {
		        db.find({complete: true, cluster: clusterId}, function (err, docs) {
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
		          var updatedData = {
		          	numRunning: results[2].numRunning,
		          	numIdle: results[2].numIdle,
		          	numError: results[2].numError,
		          	jobs: null
		          };
		          $log.debug("Concat all the things!");
		          // Ok, now concat everything together.  Running jobs, completed jobs, and recently completed jobs.
		          if (recent_completed[0] == null) {
		            updatedData.jobs = completed_jobs.concat(cluster_jobs);
		          } else {
		            updatedData.jobs = recent_completed[0].concat(completed_jobs, cluster_jobs);
		          }

		          lastRequestedTime = Date.now();
		          oldData = updatedData;
		          toReturn.resolve(updatedData);
		        });
		      }
		    );
			}

			return toReturn.promise;
		}
	};
}]);