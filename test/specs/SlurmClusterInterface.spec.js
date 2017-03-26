

describe('Slurm Cluster Interface', function() {
  var clusterInterface;
  var deferred;
  var $q;
  var scope;
  var InternalConnectionService;
  
  beforeEach(angular.mock.module('ConnectionServiceModule'));
  beforeEach(angular.mock.module('ngRoute'));
  beforeEach(angular.mock.module('NotifierModule'));
  beforeEach(angular.mock.module('AnalyticsModule'));
  beforeEach(angular.mock.module('PreferencesManager'));
  beforeEach(angular.mock.module('filePathService'));
  
  beforeEach(inject(function(_$rootScope_, _$q_, connectionService) {
    
    deferred = _$q_.defer();
    $q = _$q_;
    scope = _$rootScope_;
    InternalConnectionService = connectionService;
    
    
    
    spyOn(InternalConnectionService, "runCommand").and.returnValue(deferred.promise);
    
    clusterInterface = new SlurmClusterInterface(InternalConnectionService, _$q_);
    
  }));
  

  
  it("not undefined", function() {
    
    expect(clusterInterface).toBeDefined();
    
  });
  
  it("Return Job Data 1", function() {
    var returnJob = "JOBID|PARTITION|NAME|USER|ST|TIME|NODES|START_TIME|NODELIST(REASON)|CPUS|TIME_LEFT|MIN_MEMORY|TIME_LIMIT \n\
6830158|batch|cp2k|schen|R|1-12:45:49|17|2017-03-25T04:19:29|c[0121,0801,0809,0812,0815,1002-1003,1005-1006,1009,1011-1013,1017,1021,1023-1024]|64|5-11:14:11|4000M|7-00:00:00 \n\
6979513|batch|cp2k|schen|R|1-12:45:49|26|2017-03-25T04:19:29|c[0123-0124,0810,0814,0816-0820,0822,0901,0906-0907,0909,0911-0912,0915-0919,0921-0924,2001]|64|5-11:14:11|4000M|7-00:00:00 \n\
7058259|batch|cp2k|schen|R|1-10:55:34|28|2017-03-25T06:09:44|c[0123-0124,0902,0905,0908,0910,0914-0915,0917,1101,1103-1104,1108-1109,1202-1205,1216-1219,1222-1223,2106,2115-2116,2122]|64|5-13:04:26|4000M|7-00:00:00";
    
    var jobs;
    
    clusterInterface.getJobs().then(function(data) {
      jobs = data;
    });
    
    
    deferred.resolve(returnJob);
    
    scope.$apply();
    
    //console.info(jobs);
    expect(jobs.jobs).toBeDefined();
    expect(InternalConnectionService.runCommand).toHaveBeenCalled();
    expect(jobs.jobs['6830158']).toBeDefined();
    expect(jobs.jobs['6830158'].jobName).toBe('cp2k');
    
  });
  
  
  it("Return Job Data 2", function() {
    var returnJob = "JOBID|PARTITION|NAME|USER|ST|TIME|NODES|START_TIME|NODELIST(REASON)|CPUS|TIME_LEFT|MIN_MEMORY|TIME_LIMIT \n\
7128652|batch|A test 2|dweitzel|R|0:00|1|2017-03-26T17:28:10|c0404|1|10:00|1024M|10:00";
    
    var jobs;
    
    clusterInterface.getJobs().then(function(data) {
      jobs = data;
    });
    
    
    deferred.resolve(returnJob);
    
    scope.$apply();
    
    //console.info(jobs);
    expect(jobs.jobs).toBeDefined();
    expect(InternalConnectionService.runCommand).toHaveBeenCalled();
    expect(jobs.jobs['7128652']).toBeDefined();
    expect(jobs.jobs['7128652'].jobName).toBe('A test 2');
    expect(jobs.jobs['7128652'].memory).toBe('1024M');
    
  });
  
  
  
});
