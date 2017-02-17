
describe('File Path Service', function() {
  var filePathService;
  
  // Before each test load our api.users module
  beforeEach(angular.mock.module('filePathService'));
  
  // Before each test set our injected Users factory (_Users_) to our local Users variable
  beforeEach(inject(function(_filePathService_) {
    
    // Do the file path join
    //spyOn(path, 'join');
    
    //window.require = function() {};
    process.platform = 'darwin';
    process.env.HOME = "/home/derek"
    
    spyOn(window, 'require').and.callFake(function(package) {
      switch(packageName) {
        case "path":
          return path;
          break;
        
      }
    });
    
    filePathService = _filePathService_;
  }));
  
  // A simple test to verify the Users factory exists
  it('should exist', function() {
    expect(filePathService).toBeDefined();
  });
  
  it('Return job history', function() {

    expect(filePathService.getJobHistory()).toBe('/home/derek/Library/HCCGo/jobHistory.db');
    
  });
  
  it('Return Data Path', function() {
    expect(filePathService.getDataPath()).toBe('/home/derek/Library/HCCGo');
    
  });
  
  it('Return Submitted Jobs', function() {
    expect(filePathService.getSubmittedJobs()).toBe('/home/derek/Library/HCCGo/submittedJobs.db');
  });
  
  it('Return Prefrence Path', function() {
    expect(filePathService.getPreferencePath()).toBe('/home/derek/Library/HCCGo/preferences.json');
  });
  
  
  
});
