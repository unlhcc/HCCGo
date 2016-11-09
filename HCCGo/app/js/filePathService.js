filePathService = angular.module('filePathService', []);
filePathService.service('filePathService', function() {

  var dataPath = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/' : process.env.HOME);
  var path = require('path');
  dataPath = path.join(dataPath, 'HCCGo');
  var jobHistoryPath = path.join(dataPath, 'jobHistory.db');
  var submittedJobsPath = path.join(dataPath, 'submittedJobs.db')
  return {
    getJobHistory: function() {
      return jobHistoryPath;
    },
    getDataPath: function() {
      return dataPath;
    },
    getSubmittedJobs: function() {
      return submittedJobsPath;
    }
  };

});
