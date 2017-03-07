describe('Data Usage Service', () => {
    var dataUsageService;
    var $q;
    var deferred;

    beforeEach(angular.mock.module('dataUsageService'));
    
    beforeEach(inject(function(_$q_) {
        $q = _$q_;

        deferred = $q.defer();
        clusterInterface = {
          getStorageInfo: function() {}
        }
        
        spyOn(clusterInterface, 'getStorageInfo').and.returnValue(deferred.promise);
    }));
    
    beforeEach(inject(function(_dataUsageService_) {
        dataUsageService = _dataUsageService_;
    }));



    it('should exist', function() {
        expect(dataUsageService).toBeDefined();
    });

    it('should be resolved', function() {
        expect(dataUsageService.getDataUsage(clusterInterface)).not.toBe(undefined);

    });
});