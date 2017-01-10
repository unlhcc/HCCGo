dataUsageService = angular.module('dataUsageService', []);

/**
 * The dataUsageService allows for faster loading of data grabbed from the cluster interface.
 * The service is called periodically, allowing for non-constant loading of statistics.
 *
 * A Promise with the data is returned, which is rendered within the controller.
 *
 * @ngdoc service
 * @memberof HCCGo
 * @class dataUsageService
 */
dataUsageService.service('dataUsageService',['$q', function($q) {

	 return {

	 	/**
	 	 * Gets storage usage from cluster
		 * @method getDataUsage
		 * @memberof HCCGo.dataUsageService
		 * @returns {Object} Promise object to be resolved in the controller
		 */
	 	getDataUsage: function(clusterInterface){
	 		var toReturn = $q.defer();

			clusterInterface.getStorageInfo().then(function(data){
			  toReturn.resolve(data);
			});
			return toReturn.promise;	 			
	 	}
	 };
}]);