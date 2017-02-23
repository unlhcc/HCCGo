

describe('Navbar Service', function() {
  var navService;
  
  // Before each test load our api.users module
  beforeEach(angular.mock.module('navService'));
  beforeEach(angular.mock.module('ConnectionServiceModule'));
  beforeEach(angular.mock.module('NotifierModule'));
  beforeEach(angular.mock.module('updaterModule'));
  beforeEach(angular.mock.module('AnalyticsModule'));
  beforeEach(angular.mock.module('PreferencesManager'));
  beforeEach(angular.mock.module('filePathService'));
  beforeEach(angular.mock.module('ngRoute'));
  
  // Before each test set our injected Users factory (_Users_) to our local Users variable
  
  beforeEach(inject(function(_$rootScope_, _$q_, connectionService, _$location_, _$routeParams_) {
    var $q = _$q_;
    $scope = _$rootScope_.$new();
    
    // We use the $q service to create a mock instance of defer
    deferred = _$q_.defer();
    
    // Use a Jasmine Spy to return the deferred promise
    spyOn(connectionService, 'getUsername').and.returnValue(deferred.promise);
    $location = _$location_
    spyOn($location, 'path')
    
    connectionService.connectionDetails = {
      "username": "derek",
      "hostname": "example.unl.edu",
      "shorthost": "Example"
    }
    
    $routeParams = _$routeParams_;
    $routeParams.clusterId = 'crane';
    
  }));
  
  beforeEach(inject(function(_navService_) {
    
    navService = _navService_;
    
  }));
  
  // A simple test to verify the Users factory exists
  it('should exist', function() {
    expect(navService).toBeDefined();
  });
  
  it('should set Location to Home', function() {
    
    navService.goHome();
    expect($location.path).toHaveBeenCalled();
    expect($location.path).toHaveBeenCalledWith("/cluster");
    
  });
  
  it('should set location to filesystem', function() {
    
    navService.goToSCP();
    expect($location.path).toHaveBeenCalled();
    expect($location.path).toHaveBeenCalledWith("/filesystem");
    
  });
  
  it('should set location to job history', function() {
    
    navService.jobHistory();
    expect($location.path).toHaveBeenCalled();
    expect($location.path).toHaveBeenCalledWith("/jobHistory")
    
  });
  
  
  it('should set username', function() {
    
    // Setup the data we wish to return for the .then function in the controller
    deferred.resolve('derek');
    
    // We have to call apply for this to work
    $scope.$apply();

    // Since we called apply, not we can perform our assertions
    expect(navService.username).not.toBe(undefined);
    expect(navService.username).toBe('derek');
    
    expect(navService.shorthost).not.toBe(undefined);
    expect(navService.shorthost).toBe('Example');
      
    
  });
  
  
  
});
