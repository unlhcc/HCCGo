

describe('Navbar Controller', function() {
  var $controller;

  
  // Before each test load our api.users module
  beforeEach(angular.mock.module('HccGoApp.NavCtrl'));
  beforeEach(angular.mock.module('ConnectionServiceModule'));
  beforeEach(angular.mock.module('NotifierModule'));
  beforeEach(angular.mock.module('updaterModule'));
  
  // Before each test set our injected Users factory (_Users_) to our local Users variable
  beforeEach(inject(function(_$controller_) {
    $controller = _$controller_;
  }));
  
  // A simple test to verify the Users factory exists
  it('should exist', function() {
    expect($controller).toBeDefined();
  });
  
  it('should set Location to Home', function() {

    var $scope = {};
    var $routeParams = {clusterId: 'crane'};
    var controller = $controller('NavCtrl', { $scope: $scope, $routeParams: $routeParams, $location: mockLocation });
    $scope.goHome();
    expect(new_location).toBe("/cluster/crane");
    
  });
  
  it('should set location to filesystem', function() {
    
    var $scope = {};
    var $routeParams = {clusterId: 'crane'};
    var controller = $controller('NavCtrl', { $scope: $scope, $routeParams: $routeParams, $location: mockLocation });
    $scope.goToSCP();
    expect(new_location).toBe("/cluster/crane/filesystem");
    
  });
  
  it('should set location to job history', function() {
    
    var $scope = {};
    var $routeParams = {clusterId: 'crane'};
    var controller = $controller('NavCtrl', { $scope: $scope, $routeParams: $routeParams, $location: mockLocation });
    $scope.jobHistory();
    expect(new_location).toBe("/cluster/crane/jobHistory");
    
  });
  
  it('should set username', function() {
    
    var $scope = {};
    var $routeParams = {clusterId: 'crane'};
    var username = "derek";
    var thenFunction = function(callback) {
      callback(username);
    }
    var connectionService = {getUsername: function() {
      return {then: thenFunction};
    }};
    var controller = $controller('NavCtrl', { $scope: $scope, $routeParams: $routeParams, $location: mockLocation, connectionService: connectionService });
    expect($scope.username).toBe(username);
    
  });
  
});
