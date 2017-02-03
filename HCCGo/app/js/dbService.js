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
dbService.service('dbService', ['filePathService', '$log', '$q', function(filePathService, $log, $q) {

  const DataStore = require('nedb');
  var path = require('path');
  var dataPath = filePathService.getDataPath();
  var jobHistory = path.join(__dirname, 'data/jobHistory.json');
  var jobHistoryPath = filePathService.getJobHistory();
  var jobHistoryDB = $q.defer();
  var submittedJobsPath = filePathService.getSubmittedJobs();
  var submittedJobsDB = $q.defer();

  // Check if app data folder is there, if not, create one with default json file
  var fs = require('fs');
  fs.exists(dataPath, function(exists) {
    if(!exists) {
      // folder doesn't exist
      fs.mkdir(dataPath, function() {
          // create default files
          fs.createWriteStream(jobHistoryPath);
          jobHistoryDB.resolve(new DataStore({ filename: jobHistoryPath, autoload: true }));
          $.getJSON(jobHistory, function(json) {
            jobHistoryDB.insert(json.jobs[0], function(err, newDoc) {
              if(err) $log.error(err);
            });
          });
          fs.createWriteStream(submittedJobsPath);
          submittedJobsDB.resolve(new DataStore({ filename: submittedJobsPath, autoload: true }));
      });
    }
    else {
      // folder does exist
      fs.exists(jobHistoryPath, function(fileExists) {
        if(!fileExists) {
          // jobhistory file doesn't exist
          fs.createWriteStream(jobHistoryPath);
          jobHistoryDB.resolve(new DataStore({ filename: jobHistoryPath, autoload: true }));
          $.getJSON(jobHistory, function(json) {
            jobHistoryDB.insert(json.jobs[0], function(err, newDoc) {
              if(err) $log.error(err);
            });
          });
        }
        else {
          jobHistoryDB.resolve(new DataStore({ filename: jobHistoryPath, autoload: true }));
        }
      });
      fs.exists(submittedJobsPath, function(fileExists) {
        if(!fileExists) {
          // jobsubmission file doesn't exist
          fs.createWriteStream(submittedJobsPath);
        }
        submittedJobsDB.resolve(new DataStore({ filename: submittedJobsPath, autoload: true }));
      });
    }
  });

  return {

    /**
     * Get the Job History DB reference.
     * @method getJobHistoryDB
     * @memberof HCCGo.dbService
     * @returns {nedb} Nedb (reference) object to query.
     */
    getJobHistoryDB: function() {
      return jobHistoryDB.promise;
    },

    /**
     * Get the Submitted jobs DB reference.
     * @method getSubmittedJobsDB
     * @memberof HCCGo.dbService
     * @returns {nedb} Nedb (reference) object to query.
     */
    getSubmittedJobsDB: function() {
      return submittedJobsDB.promise;
    }
  };

}]);
