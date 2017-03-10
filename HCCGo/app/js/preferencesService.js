preferencesService = angular.module('preferencesService', []);

/**
 * The preferences service stores settings information that can be changed by the user.
 *
 * @ngdoc service
 * @memberof HCCGo
 * @class preferencesService
 */
preferencesService.service('preferencesService', ['$log', function($log) {

  // return {
  //
  //   /**
  //    * Get the Job History DB reference.
  //    * @method getJobHistoryDB
  //    * @memberof HCCGo.dbService
  //    * @returns {nedb} Nedb (reference) object to query.
  //    */
  //   getJobHistoryDB: function() {
  //     return jobHistoryDB.promise;
  //   },
  //
  //   /**
  //    * Get the Submitted jobs DB reference.
  //    * @method getSubmittedJobsDB
  //    * @memberof HCCGo.dbService
  //    * @returns {nedb} Nedb (reference) object to query.
  //    */
  //   getSubmittedJobsDB: function() {
  //     return submittedJobsDB.promise;
  //   }
  // };

}]);
