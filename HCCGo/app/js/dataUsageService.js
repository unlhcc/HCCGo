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
dataUsageService.service('dataUsageService',['$q', '$log', function($q, $log) {
    var oldData = null;
    var lastPromise = null;
    var lastRequestedTime = 0;
	return {

       /**
     	 * Gets storage usage from cluster
    	 * @method getDataUsage
    	 * @memberof HCCGo.dataUsageService
         * @param {GenericClusterInterface} clusterInterface - Interface to grab the data from
         * @param {boolean} force - Flag denoting if the user wants to force update the graphs
    	 * @returns {Promise} Promise object to be resolved in the controller
    	 */
	 	getDataUsage: function(clusterInterface, force = false){
	 	    
            if (lastPromise === null || Date.now() - lastRequestedTime >= 300000 || force){
                lastPromise = $q.defer();
                $log.info('Updating Storage Info');
                clusterInterface.getStorageInfo().then(function(data){
                    oldData = data;
                    lastRequestedTime = Date.now();
                    lastPromise.resolve(data);
                });
            }
			return lastPromise.promise;	 			
	 	}
	 };
}]);