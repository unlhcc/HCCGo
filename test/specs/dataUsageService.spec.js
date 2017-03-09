describe('Data Usage Service', () => {
    var dataUsageService;
    var $q;
    var $rootScope;
    var deferred;

    beforeEach(angular.mock.module('dataUsageService'));
    
    beforeEach(inject(function(_$q_, _$rootScope_) {
        $q = _$q_;
        $rootScope = _$rootScope_;

        deferred = $q.defer();
        clusterInterface = {
          getStorageInfo: function() {}
        };
        
        spyOn(clusterInterface, 'getStorageInfo').and.returnValue(deferred.promise);
    }));
    
    beforeEach(inject(function(_dataUsageService_) {
        dataUsageService = _dataUsageService_;
    }));

    it('should exist', function() {
        expect(dataUsageService).toBeDefined();
    });

    it('should be resolved', function() {
        deferred.resolve([
            {
                name: "fakeWork"
            },
            {
                name: "fakeHome"
            }
        ]);
        $rootScope.$apply();

        expect(dataUsageService.getDataUsage(clusterInterface)).not.toBe(undefined);
        expect(clusterInterface.getStorageInfo).toHaveBeenCalled();
        dataUsageService.getDataUsage(clusterInterface).then(function(data) {
            expect(data).toBe(Array.isArray());
        })
    });
});