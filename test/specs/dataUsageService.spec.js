describe('Data Usage Service', () => {
    var dataUsageService;
    var $q;
    var deferred;

    beforeEach(angular.mock.module('dataUsageService'));

    beforeEach(inject(function(_dataUsageService_) {
        dataUsageService = dataUsageService;
    }));

    
    beforeEach(inject(function(_$q_) {
        $q = _$q_;

        deferred = $q.defer();

        spyOn(clusterInterface, 'getStorageInfo').and.returnValue(deferred.promise);
    }));



    it('should exist', function() {
        expect(dataUsageService).toBeDefined();
    });

    it('should be resolved', function() {
        expect(dataUsageservice.getDataUsage()).not.toBe(undefined);

    });
});