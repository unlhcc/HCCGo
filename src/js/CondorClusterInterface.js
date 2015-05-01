



var CondorClusterInterface = function(connectionService, $q) {
  
  GenericClusterInterface.call(this, connectionService, $q);
  
  
};


// Javascript object inheritance
CondorClusterInterface.prototype = Object.create(GenericClusterInterface.prototype);

CondorClusterInterface.prototype.constructor = CondorClusterInterface;

CondorClusterInterface.prototype.getJobs = function() {
  
  // return a promise if the jobs info are found
  var deferred = this.$q.defer();
  
  var promise = this.connectionService.runCommand("condor_q  `whoami` -format '%i\\n' JobStatus")
  promise.then(function(data) {
    console.log("Got data: " + data);
    
    var lines = data.split('\n');
    var returnData = {
      numRunning: 0,
      numIdle: 0,
      numError: 0
    };
    for (var i = 0; i < lines.length; i++) {
      if (lines[i] == '2') {
        returnData.numRunning += 1;
      } else if (lines[i] == '1') {
        returnData.numIdle += 1;
      } else {
        returnData.numError += 1;
      }
    }
    returnData.data = data;
    deferred.resolve(returnData);
    
  }, function(reason) {
    console.log("Error: " + reason);
    
  })
  
  
  return deferred.promise;
  
}



CondorClusterInterface.prototype.getStorageInfo = function() {
  
  // Return a promise if the jobs are found
  
}
