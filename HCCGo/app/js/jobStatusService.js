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
jobStatusService.service('jobStatusService',['$log','$q','notifierService', 'dbService', function($log, $q, notifierService, dbService) {
	var async = require('async');
	var oldData = null;
	var lastRequestedTime = 0;
	var lastPromise = null;
	return {

	  /**
     * Makes asynchronous calls to check for job statuses within the database
     * @method refreshDatabase
     * @memberof HCCGo.jobStatusService
     * @param {GenericClusterInterface} clusterInterface - Used to grab uncompleted jobs from the cluster
     * @param {integer} clusterId - Unique ID of the cluster for querying the database
     * @param {boolean} force - Flag denoting if the user wants to force update the database
     * @returns {Promise} Promise object to be resolved in the controller
		 */
		refreshDatabase: function(clusterInterface, clusterId, force=false) {

			// The lastPromise is a single promise that we will hand out to all requesters
			// If this is the first run, or if it is time for new data
			if (lastPromise == null || ((Date.now() - lastRequestedTime > 15000) || force)) {
				lastPromise = $q.defer();
			  lastRequestedTime = Date.now();

			async.parallel([

		      // Query all the uncompleted jobs in the DB
		      function(callback) {
						dbService.getSubmittedJobsDB().then(function(db) {
			        db.find({complete: false, cluster: clusterId}, function (err, docs) {

			          if (err) {
			            $log.error("Error querying the DB for job states");
			            return callback("Error querying the DB for job states");
			          }

			          return callback(null, docs);
			        });
						});
		      },

		      function(callback) {
						dbService.getSubmittedJobsDB().then(function(db) {
			        db.find({complete: true, cluster: clusterId}, function (err, docs) {
			          if (err) {
			            $log.error("Error querying the DB for job states");
			            return callback("Error querying the DB for job states");
			          }
			          return callback(null, docs);

			        });
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
						var db_jobs = results[0];
		        var completed_jobs = results[1];
		        var cluster_jobs = results[2].jobs;

						// For each job in the db_jobs, match it and update the status from squeue
						var recent_completed = [];
						for (var i = 0; i < db_jobs.length; i++) {
							if (!cluster_jobs.hasOwnProperty(db_jobs[i].jobId) ) {
								// Recenty completed job (or disappeared from the squeue output)
								db_jobs[i].status = 'COMPLETE';
								recent_completed.push(db_jobs[i]);
								db_jobs.splice(i, 1);
								i--;
							} else {
								// Job showed up in the cluster jobs output, update it's status
								cluster_job = cluster_jobs[db_jobs[i].jobId];
								if (cluster_job.running) {
									db_jobs[i].status = 'RUNNING';
								} else if (cluster_job.idle) {
									db_jobs[i].status = 'IDLE';
								}

								db_jobs[i] = Object.assign(db_jobs[i], cluster_job);

								// For some reason, I can't update the entire document
								// Have to do a weird anonymous function for the db_jobs[i] because
								// by the time the function is executed, db_jobs could be different (splicing)
								// I also added cluster_job, but it probably isn't necessary
								dbService.getSubmittedJobsDB().then( (function(db_job, cluster_job) {
									return function(db) {
										db.update(
											{ _id: db_job._id },
											{ $set:
												{
												"running": cluster_job.running,
												"idle": cluster_job.idle,
												"error": cluster_job.error,
												"status": db_job.status,
												"elapsed": cluster_job.runTime
												}
											},
											{},
											function(err, numAffected, affectedDocuments, upsert) {
												if (err) $log.error(err);
											}
										)};
									// Call the function I just created above, it will return a
									// new anonymous function.
									})(db_jobs[i], cluster_job));

							}
						}


		        // Now, recent_completed are jobs that are in the DB as running, but
		        // not in the list of running or idle jobs.  So they must
		        // have completed

		        // Update the DB
		        async.series([
		          function(callback) {
		            if (recent_completed.length < 1) {
		              return callback(null, null);
		            }
		            clusterInterface.getCompletedJobs(recent_completed).then(
		              function(jobs) {

		                $log.debug("Got " + jobs.length + " completed jobs");
		                var recent_completed_jobs = [];
		                async.each(jobs, function(job, each_callback) {

		                  $log.debug(job);
											dbService.getSubmittedJobsDB().then(function(db) {
                        db.update(
                          { _id: job._id },
                          { $set:
                            {
                            "complete": true,
                            "idle": false,
                            "error": job.State != "COMPLETED" && job.State != "RUNNING" && job.State != "IDLE" && !job.State.startsWith("CANCELLED"),
                            "running": false,
                            "cancelled" : job.State.startsWith("CANCELLED"),
                            "elapsed": job.Elapsed,
                            "reqMem": job.ReqMem,
                            "jobName": job.JobName,
                            "status": "COMPLETE",
                            "reportedStatus": job.State,
                            "maxMemory": job.MaxRSS
                            }
                          },
                          { returnUpdatedDocs: true },
                          function (err, numReplaced, affectedDocuments) {
                            // update db with data so it doesn't have to be queried again
                            
                            if (!err && !affectedDocuments.cancelled) {
                              notifierService.success('Your job, ' + affectedDocuments.jobName + ', has been completed', 'Job Completed!');

                              recent_completed_jobs.push(affectedDocuments);
                              return each_callback(null);

                            }
                          }
                        )});
		                }, function(err) {
		                  // After the for loop, return all of the recently completed jobs.
		                  return callback(null, recent_completed_jobs);

		                });


		              }
		            , function(msg) {
		              $log.debug("No jobs returned by completed job");
		              return callback(null, null);
		            });

		          }
		        ],
		        function(err, recent_completed_jobs) {
		          var updatedData = {
		          	numRunning: results[2].numRunning,
		          	numIdle: results[2].numIdle,
		          	numError: results[2].numError,
		          	jobs: null
		          };
		          $log.debug("Concat all the things!");
		          // Ok, now concat everything together.  Running jobs, completed jobs, and recently completed jobs.
		          if (recent_completed_jobs[0] == null) {
		            updatedData.jobs = completed_jobs.concat(db_jobs);
		          } else {
		            updatedData.jobs = recent_completed_jobs[0].concat(completed_jobs, db_jobs);
		          }

		          lastPromise.resolve(updatedData);
		        });
		      }
		    );
			}

			return lastPromise.promise;
		}
	};
}]);
