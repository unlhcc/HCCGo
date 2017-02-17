
describe('File Path Service', function() {
  var filePathService;
  
  // Before each test load our api.users module
  beforeEach(angular.mock.module('filePathService'));
  
  beforeEach(function() {
    process = {'platform': 'linux', 'env': {'HOME': '/home/derek'}};
  });
  
  // Before each test set our injected Users factory (_Users_) to our local Users variable
  beforeEach(inject(function(_filePathService_) {
    
    filePathService = _filePathService_;
    
  }));
  
  // A simple test to verify the Users factory exists
  it('should exist', function() {
    expect(filePathService).toBeDefined();
  });
  
  describe("Linux Tests", function() {
    
    beforeEach(function() {
      process.platform = 'linux';
    });
    
    it('Return job history', function() {
      expect(filePathService.getJobHistory()).toBe('/home/derek/HCCGo/jobHistory.db');
      
    });
    
    it('Return Data Path', function() {
      expect(filePathService.getDataPath()).toBe('/home/derek/HCCGo');
      
    });
    
    it('Return Submitted Jobs', function() {
      expect(filePathService.getSubmittedJobs()).toBe('/home/derek/HCCGo/submittedJobs.db');
    });
    
    it('Return Prefrence Path', function() {
      expect(filePathService.getPreferencePath()).toBe('/home/derek/HCCGo/preferences.json');
    });
    
  });
  
  describe("Mac Tests", function() {
    beforeEach(function() {
      process.platform = 'darwin';
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
  
  describe("Windows Tests", function() {
    beforeEach(function() {
      process.platform = 'windows';
      process.env.APPDATA = 'C:/users/derek';
    });
    
    it('Return job history', function() {
      expect(filePathService.getJobHistory()).toBe('C:/users/derek/HCCGo/jobHistory.db');
    });
    
    it('Return Data Path', function() {
      expect(filePathService.getDataPath()).toBe('C:/users/derek/HCCGo');
      
    });
    
    it('Return Submitted Jobs', function() {
      expect(filePathService.getSubmittedJobs()).toBe('C:/users/derek/HCCGo/submittedJobs.db');
    });
    
    it('Return Prefrence Path', function() {
      expect(filePathService.getPreferencePath()).toBe('C:/users/derek/HCCGo/preferences.json');
    });
    
  });
  
  
  
  
  
  
  
});
