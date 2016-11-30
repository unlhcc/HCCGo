dbService = angular.module('dbService', []);
dbService.service('dbService', ['filePathService', function(filePathService) {

  const DataStore = require('nedb');
  var jobHistoryPath = filePathService.getJobHistory();
  var jobHistoryDB = new DataStore({ filename: jobHistoryPath, autoload: true });
  var submittedJobsPath = filePathService.getSubmittedJobs();
  var submittedJobsDB = new DataStore({ filename: submittedJobsPath, autoload: true });
  return {
    getJobHistoryDB: function() {
      return jobHistoryDB;
    },
    getSubmittedJobsDB: function() {
      return submittedJobsDB;
    }
  };

}]);
