
jobHistoryModule = angular.module('HccGoApp.jobHistoryCtrl', ['ngRoute' ]);


/**
 * Used to manage the job history.
 * @class jobService
 */
jobHistoryModule.service('jobService', ['$q', 'connectionService', 'dbService', function($q, connectionService, dbService) {

  var job = null;
  
  var getJob = function() {
    var temp = job;
    job = null;
    return temp;
  }
  
  var setJob = function(value) {
    job = value;
  }
  
  var getDBJobs = function() {
    var toReturn = $q.defer();
    
    dbService.getJobHistoryDB().then(function(jobHistoryDB) {
      jobHistoryDB.find({}, function (err, docs) {
        // if data already loaded, just add them to the list
        return toReturn.resolve(docs);

        if(err) console.log("Error fetching completed jobs: " + err);
      });
    });
    
    return toReturn.promise;
    
  }
  
  /**
   * Add a job to the job history
   * Required attributes:
   * * runtime
   * * memory
   * * jobname
   * * location
   * * error
   * * output
   * * modules (Array)
   * * commands (multi line, with `\n`s)
   * 
   * @memberof jobService
   */
  var addDBJob = function(job) {
    toReturn = $q.defer();
    var now = Date.now();
    var set_default = function(obj, attribute_name, default_val) {
      if (attribute_name in obj) {
        return true;
      } else {
        obj[attribute_name] = default_val;
        return false;
      }
    }
    
    set_default(obj, "runtime", "1:00:00");
    set_default(obj, "memory", 1024);
    set_default(obj, "jobname", "Default Job Name");
    set_default(obj, "location", "$WORK/submit.slurm");
    set_default(obj, "error", "$WORK/job.err");
    set_default(obj, "output", "$WORK/job.out");
    set_default(obj, "modules", []);
    if (!set_default(obj, "commands", null)) {
      toReturn.reject("No Commands in job");
    }
    
    // Use a whitelist to only put some stuff in
    var newJob = {
      "runtime": job.runtime,
      "memory": job.memory,
      "jobname": job.jobname,
      "location": job.location,
      "error": job.error,
      "output": job.output,
      "modules": ((job.modules != null) ? job.modules : []),
      "commands": job.commands,
      "timestamp": now,
      "cluster": connectionService.connectionDetails.shorthost
    };
    dbService.getJobHistoryDB().then(function(jobHistoryDB) {
      jobHistoryDB.insert(newJob, function(err, newDoc) {
        if(err) {
          $log.error(err);
          return toReturn.reject(err);
        }
        toReturn.resolve();
      });
    });
    
    return toReturn.promise;
  }
  

  return {
    getJob: getJob,
    setJob: setJob,
    getDBJobs: getDBJobs,
    addDBJob: addDBJob
    
  }

}]).controller('jobHistoryCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'jobService', 'dbService', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, jobService, dbService) {

  $scope.params = $routeParams;

  $scope.cancel = function() {
    $location.path("/cluster");
  }

  $scope.loadDefault = function() {

    $location.path("/jobSubmission");

  }

  $scope.loadJob = function(job, clone) {
    job.clone = clone;
    jobService.setJob(job);
    $location.path("/jobSubmission");

  }

  // Get completed jobs from db file
  jobService.getDBJobs().then(function(jobs) {
    $scope.jobs = jobs;
  });


  $scope.deleteJob = function(job) {
    bootbox.confirm({
      message: "Are you sure you want to delete this job?",
      callback: function(result) {
        if(result) {
          // remove panel
          $("#panel"+job._id).fadeOut(500, function() {
            $(this).css({"visibility":"hidden",display:'block'}).slideUp();
          });
          // remove from angular binding
          for(var i=0; i<$scope.jobs.length; i++) {
            if($scope.jobs[i]._id == job._id) {
              $scope.jobs.splice(i,1);
            }
          }
          dbService.getJobHistoryDB().then(function(db) {
            db.remove({ _id: job._id }, { multi: true }, function (err, numRemoved) {
              if(err) $log.error("Error deleting document " + err);
            });
          });
        }
      }
    });
  }


}]);
