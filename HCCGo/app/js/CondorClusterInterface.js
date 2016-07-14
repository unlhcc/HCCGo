

function pad(num, size) {
  size = typeof size !== 'undefined' ?  size : 2;
  var s = num+"";
  while (s.length < size) s = "0" + s;
  return s;
}


function secondsToTimeDelta(seconds) {
  
  constructed = "";
  if (seconds / 86400 > 1) {
    constructed += Math.floor(seconds / 86400).toString() + "+";
  }
  constructed += pad((Math.floor((seconds / 3600) % 24)).toString()) + ":";
  constructed += pad((Math.floor((seconds / 60) % 60)).toString()) + ":";
  constructed += pad((Math.floor(seconds % 60)).toString());
  return constructed;
  
}

function basename(path) {
   return path.split('/').reverse()[0];
}



var CondorClusterInterface = function(connectionService, $q) {
  
  GenericClusterInterface.call(this, connectionService, $q);
  
  
};


// Javascript object inheritance
CondorClusterInterface.prototype = Object.create(GenericClusterInterface.prototype);

CondorClusterInterface.prototype.constructor = CondorClusterInterface;

CondorClusterInterface.prototype.getJobs = function() {
  
  // return a promise if the jobs info are found
  var deferred = this.$q.defer();
  
  var promise = this.connectionService.runCommand("condor_q  `whoami` -l")
  promise.then(function(data) {
    console.log("Got data: " + data);
    jobs = [];
    var returnData = {
      numRunning: 0,
      numIdle: 0,
      numError: 0
    };
    
    // Classads are split by 2 new lines
    classads = data.split("\n\n");
    
    // For each classad
    classads.forEach(function(element, index, array) {
      if (element == "") return;
      curJob = {}
      // For each attribute
      element.split("\n").forEach(function(element, index, array) {
        
        split_values = element.split(" = ");
        name = split_values[0]
        value = split_values[1].replace(/\"/g, "");
        curJob[name] = value;
      });
      
      // Set some attributes 
      curJob.jobId = curJob.ClusterId + "." + curJob.ProcId;
      curJob.runTime = secondsToTimeDelta(parseInt(curJob["ServerTime"]) - parseInt(curJob["EnteredCurrentStatus"]));
      curJob.jobName = basename(curJob.Cmd);
      

      
      curJob.idle = curJob.running = curJob.error = false;
      
      switch(curJob.JobStatus) {
        case "1":
          returnData.numIdle += 1;
          curJob.idle = true;
          break;
        case "2":
          returnData.numRunning += 1;
          curJob.running = true;
          break;
        default:
          returnData.numError += 1;
          curJob.error = true;
      }
      
      jobs.push(curJob);
    });
    
    returnData.data = data;
    returnData.jobs = jobs;
    deferred.resolve(returnData);
    

    
  }, function(reason) {
    console.log("Error: " + reason);
    
  });
  
  
  return deferred.promise;
  
}



CondorClusterInterface.prototype.getStorageInfo = function() {
  
  // Return a promise if the jobs are found
  
}
