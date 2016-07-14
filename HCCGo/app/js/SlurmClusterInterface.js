



var SlurmClusterInterface = function(connectionService, $q) {
  
  GenericClusterInterface.call(this, connectionService, $q);
  
  
};


// Javascript object inheritance
SlurmClusterInterface.prototype = Object.create(GenericClusterInterface.prototype);

SlurmClusterInterface.prototype.constructor = SlurmClusterInterface;

SlurmClusterInterface.prototype.getJobs = function() {
  
  // return a promise if the jobs info are found
  var deferred = this.$q.defer();
  
  var promise = this.connectionService.runCommand("squeue -u `whoami` -o '%i,%P,%j,%u,%t,%M,%D,%S,%R'");
  promise.then(function(data) {
    console.log("Got data: " + data);
    
    var lines = data.split('\n');
    var returnData = {
      numRunning: 0,
      numIdle: 0
    };
    
    csv_parse = require("csv-parse/lib/sync");
    records = csv_parse(data, {columns: true});
    jobs = [];
    
    records.forEach(function(entry) {
      curJob = {};
      curJob.jobId = entry.JOBID;
      curJob.jobName = entry.NAME;
      
      curJob.idle = curJob.running = curJob.error = false;
      
      if (entry['ST'] == "R") {
        curJob.running = true;
        returnData.numRunning += 1;
      } else {
        curJob.idle = true;
        returnData.numIdle += 1;
      }
      
      curJob.runTime = entry.TIME;
      curJob.startTime = entry.START_TIME;
      jobs.push(curJob);
    });
    
    
    returnData.data = data;
    returnData.jobs = jobs
    deferred.resolve(returnData);
    
  }, function(reason) {
    console.log("Error: " + reason);
    
  })
  
  
  return deferred.promise;
  
}



//SlurmClusterInterface.prototype.getStorageInfo = function() {
  
  // Return a promise if the jobs are found
  
//}
