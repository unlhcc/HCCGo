

/**
  * Generic interface for clusters.  Should be classed 
  * Javascript Object Inheritance, FTW!
  *
  */

var GenericClusterInterface = function(connectionService, $q) {
  this.$q = $q;
  this.connectionService = connectionService;
}

GenericClusterInterface.prototype.getJobs = function() {
  
  // return a promise if the jobs info are found
  
}


GenericClusterInterface.prototype.getStorageInfo = function() {
  
  // Return a promise if the storage info
  var storagePromise = this.$q.defer()
  
  this.connectionService.runCommand("quota -w -f /home").then(function(data) {
    
    // Split the output
    reported_output = data.split("\n")[2];
    
    returnData = {
      blocksUsed: 0,
      blocksQuota: 0,
      blocksLimit: 0,
      filesUsed: 0,
      filesQuota: 0,
      filesLimit: 0
    }
    
    split_output = reported_output.split(/[ ]+/);
    function KilobytestoGigabytes(kbytes) {
      return parseInt(kbytes) / Math.pow(1024, 2);
    }
    returnData.blocksUsed = KilobytestoGigabytes(split_output[1]);
    returnData.blocksQuota = KilobytestoGigabytes(split_output[2]);
    returnData.blocksLimit = KilobytestoGigabytes(split_output[3]);
    
    storagePromise.resolve(returnData);
    
    
  });
  
  
  return storagePromise.promise;
}
