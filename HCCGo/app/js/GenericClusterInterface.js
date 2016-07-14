

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
  var connectionService = this.connectionService;
  
  this.connectionService.runCommand("quota -w -f /home").then(function(data) {
    
    // Split the output
    reported_output = data.split("\n")[2];
    
    var returnData = [];
    
    work = {
      name: "Work",
      blocksUsed: 0,
      blocksQuota: 0,
      blocksLimit: 0,
      filesUsed: 0,
      filesQuota: 0,
      filesLimit: 0
    }
      
    home = {
      name: "Home",
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
    
    home.blocksUsed = KilobytestoGigabytes(split_output[1]);
    home.blocksQuota = KilobytestoGigabytes(split_output[2]);
    home.blocksLimit = KilobytestoGigabytes(split_output[3]);
    returnData.push(home);
    
    connectionService.runCommand("lfs quota -g `id -g` /work").then(function(data) {
      // Split the output
      reported_output = data.split("\n")[2];
      
      split_output = $.trim(reported_output).split(/[ ]+/);
      
      work.blocksUsed = KilobytestoGigabytes(split_output[1]);
      work.blocksQuota = KilobytestoGigabytes(split_output[2]);
      work.blocksLimit = KilobytestoGigabytes(split_output[3]);
      returnData.push(work);
      
      storagePromise.resolve(returnData);
      
    });
    
    
    
    
  });
  
  
  return storagePromise.promise;
}
