dbService = angular.module('dbService', []);

/**
 * The dbService provides access to the various DB's.  Additionally,
 they allow the loading of the DB's only once, which stops any race conditions of trying to open the DB more than once.
 *
 * The DBs returned by the `dbService` are all nedb Databases.
 * 
 * Documentation on [Nedb](https://github.com/louischatriot/nedb).
 * 
 * @ngdoc service
 * @memberof HCCGo
 * @class dbService
 */
dbService.service('dbService', ['filePathService', function(filePathService) {

  const DataStore = require('nedb');
  var jobHistoryPath = filePathService.getJobHistory();
  var jobHistoryDB = new DataStore({ filename: jobHistoryPath, autoload: true });
  var submittedJobsPath = filePathService.getSubmittedJobs();
  var submittedJobsDB = new DataStore({ filename: submittedJobsPath, autoload: true });
  return {
    
    /**
     * Get the Job History DB reference.
     * @method getJobHistoryDB
     * @memberof HCCGo.dbService
     * @returns {nedb} Nedb (reference) object to query.
     */
    getJobHistoryDB: function() {
      return jobHistoryDB;
    },
    
    /**
     * Get the Submitted jobs DB reference.
     * @method getSubmittedJobsDB
     * @memberof HCCGo.dbService
     * @returns {nedb} Nedb (reference) object to query.
     */
    getSubmittedJobsDB: function() {
      return submittedJobsDB;
    }
  };

}]);
