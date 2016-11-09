



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

SlurmClusterInterface.prototype.getCompletedJobs = function(docs) {
  var deferred = this.$q.defer();
  var csv = require('csv');
  var completedJobs = [];
  for(var i = 0; i < docs.length; i++) {
    // setup return document
    var returnData = {
      "_id": docs[i]._id
    }
    this.connectionService.runCommand("sacct -j " + docs[i].jobId + " -l --noconvert -P").then(function(data) {
      // parse data and make list of docs to update the db with
      csv.parse(data, {delimiter: '|'}, function(err, data) {
        var headers = data[0] === undefined ? [] : data[0];
        var jobData = data[1] === undefined ? [] : data[1];
        var batchData = data[2] === undefined ? [] : data[2];
        var desiredFields = [
          "Elapsed",
          "ReqMem",
          "State",
          "JobName"
        ]
        // loop through headers to get the indices of the desired fields
        for(var j = 0; j < headers.length; j++) {
          var index = desiredFields.indexOf(headers[j]);
          if(index > -1) {
            if(headers[j] == "JobName")
              returnData[desiredFields[index]] = jobData[j] === undefined ? "" : jobData[j];
            else
              returnData[desiredFields[index]] = batchData[j] === undefined ? "" : batchData[j];
          }
        }
        if(returnData.State == "COMPLETED") completedJobs.push(returnData);
        if(i==docs.length) {
          if(completedJobs.length > 0) deferred.resolve(completedJobs);
          else deferred.reject("No running jobs have been completed.")
        }
      });

    });

  }
  return deferred.promise;
}



//SlurmClusterInterface.prototype.getStorageInfo = function() {

  // Return a promise if the jobs are found

//}
