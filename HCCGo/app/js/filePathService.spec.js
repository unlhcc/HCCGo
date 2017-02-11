
describe('File Path Service', function() {
  var filePathService;
  process = {}
  process.env = {}
  process.platform = 'darwin';
  process.env.HOME = "/home/derek"
  path = {}
  path.join = function() {
    new_array = [];
    for (var i = 0; i < arguments.length; i++) {
      new_array.push(arguments[i]);
    }
    return new_array.join('/');
    
  }
  require = function(packageName) {
    switch(packageName) {
      case "path":
        return path;
        break;
    }
  }
  
  // Before each test load our api.users module
  beforeEach(angular.mock.module('filePathService'));
  
  // Before each test set our injected Users factory (_Users_) to our local Users variable
  beforeEach(inject(function(_filePathService_) {
    filePathService = _filePathService_;
  }));
  
  // A simple test to verify the Users factory exists
  it('should exist', function() {
    expect(filePathService).toBeDefined();
  });
  
  it('Return job history', function() {
    expect(filePathService.getJobHistory()).toBe(path.join(process.env.HOME, 'Library/', 'HCCGo', 'jobHistory.db'));
  });
  
  it('Return Data Path', function() {
    expect(filePathService.getDataPath()).toBe(path.join(process.env.HOME, 'Library/', 'HCCGo'));
  });
  
  it('Return Submitted Jobs', function() {
    expect(filePathService.getSubmittedJobs()).toBe(path.join(process.env.HOME, 'Library/', 'HCCGo', 'submittedJobs.db'));
  });
  
  it('Return Prefrence Path', function() {
    expect(filePathService.getPreferencePath()).toBe(path.join(process.env.HOME, 'Library/', 'HCCGo', 'preferences.json'));
  });
  
  
  
});
