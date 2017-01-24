filePathService = angular.module('filePathService', []);
/**
 * The filePathService provides an interface to find the paths of specific files on the computer.  These files, so far, will survive through updates and re-installs.
 * 
 * The data path is determined through the node.js expression:
 *
 *     dataPath = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/' : process.env.HOME);
 *
 * @ngdoc service
 * @memberof HCCGo
 * @class filePathService
 */
filePathService.service('filePathService', function() {

  var dataPath = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/' : process.env.HOME);
  var path = require('path');
  dataPath = path.join(dataPath, 'HCCGo');
  var jobHistoryPath = path.join(dataPath, 'jobHistory.db');
  var submittedJobsPath = path.join(dataPath, 'submittedJobs.db')
  var preferencesPath = path.join(dataPath, 'preferences.json')
	
  return {
    /**
     * Get the job history path.  The job history is a nedb database.
     * @method getJobHistory
     * @memberof HCCGo.filePathService
     * @return {String} Path to job history DB.
     */
    getJobHistory: function() {
      return jobHistoryPath;
    },
    
    /**
     * Get the data path where things can be stored through updates.
     * @method getDataPath
     * @memberof HCCGo.filePathService
     * @return {String} Path to the data path on the computer.
     */
    getDataPath: function() {
      return dataPath;
    },
    
    /**
     * Get the submitted jobs DB.  The submitted jobs is a nedb database.
     * @method getSubmittedJobs
     * @memberof HCCGo.filePathService
     * @return {String} Path to the submitted jobs DB.
     */
    getSubmittedJobs: function() {
      return submittedJobsPath;
    },

    /**
     * Get the preferences JSON file.
     * @method getPreferences
     * @memberof HCCGo.filePathService
     * @return {String} Path to the preferences json file.
     */
    getPreferencePath: function() {
      return preferencesPath;
    }

  };

});
