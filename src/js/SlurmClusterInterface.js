



var SlurmClusterInterface = function(connectionService, $q) {
  
  GenericClusterInterface.call(this, connectionService, $q);
  
  
};


// Javascript object inheritance
SlurmClusterInterface.prototype = Object.create(GenericClusterInterface.prototype);

SlurmClusterInterface.prototype.constructor = SlurmClusterInterface;

SlurmClusterInterface.prototype.getJobs = function() {
  
  // return a promise if the jobs info are found
  var deferred = this.$q.defer();
  
  var promise = this.connectionService.runCommand("squeue -u `whoami`")
  promise.then(function(data) {
    console.log("Got data: " + data);
    
    var lines = data.split('\n');
    var returnData = {
      numRunning: 0,
      numIdle: 0
    };
    for (var i = 0; i < lines.length; i++) {
      split_line = lines[i].split(/[ ]+/);
      if (split_line[5] == 'R') {
        returnData.numRunning += 1;
      } else if (split_line[5] == 'PD') {
        returnData.numIdle += 1;
      }
    }
    returnData.data = data;
    deferred.resolve(returnData);
    
  }, function(reason) {
    console.log("Error: " + reason);
    
  })
  
  
  return deferred.promise;
  
}



//SlurmClusterInterface.prototype.getStorageInfo = function() {
  
  // Return a promise if the jobs are found
  
//}
