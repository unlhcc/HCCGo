

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
  
  // Return a promise if the jobs are found
  
}
