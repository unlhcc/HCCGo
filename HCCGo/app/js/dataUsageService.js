dataUsageService = angular.module('dataUsageService', []);

dataUsageService.service('dataUsageService',['$q', function($q) {
	 return {
	 	getDataUsage: function(clusterInterface){
	 		var toReturn = $q.defer()
			clusterInterface.getStorageInfo().then(function(data){
			  toReturn.resolve(data);
			});
			return toReturn.promise;
	 	}
	 };
}]);