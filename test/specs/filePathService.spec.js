
describe('File Path Service', function() {
  var filePathService;
  var isWin = /^win/.test(process.platform);
  var path = require("path");
  
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
        var expectPath = path.join(process.env.HOME, 'HCCGo', 'jobHistory.db');
        expect(filePathService.getJobHistory()).toBe(expectPath);
      
    });
    
    it('Return Data Path', function() {
      var expectPath = path.join(process.env.HOME, 'HCCGo');
      expect(filePathService.getDataPath()).toBe(expectPath);
      
    });
    
    it('Return Submitted Jobs', function() {
      var expectPath = path.join(process.env.HOME, 'HCCGo', 'submittedJobs.db');
      expect(filePathService.getSubmittedJobs()).toBe(expectPath);
    });
    
    it('Return Prefrence Path', function() {
      var expectPath = path.join(process.env.HOME, 'HCCGo', 'preferences.json');
      expect(filePathService.getPreferencePath()).toBe(expectPath);
    });
    
  });
  
  describe("Mac Tests", function() {
    beforeEach(function() {
      process.platform = 'darwin';
    });
    
    it('Return job history', function() {
      var expectPath = path.join(process.env.HOME, 'Library', 'HCCGo',  'jobHistory.db');
      expect(filePathService.getJobHistory()).toBe(expectPath);
    });
    
    it('Return Data Path', function() {
      var expectPath = path.join(process.env.HOME, 'Library', 'HCCGo');
      expect(filePathService.getDataPath()).toBe(expectPath);
      
    });
    
    it('Return Submitted Jobs', function() {
      var expectPath = path.join(process.env.HOME, 'Library', 'HCCGo',  'submittedJobs.db');
      expect(filePathService.getSubmittedJobs()).toBe(expectPath);
    });
    
    it('Return Prefrence Path', function() {
      var expectPath = path.join(process.env.HOME, 'Library', 'HCCGo',  'preferences.json');
      expect(filePathService.getPreferencePath()).toBe(expectPath);
    });
    
  });
  
  describe("Windows Tests", function() {
    beforeEach(function() {
      process.platform = 'windows';
      process.env.APPDATA = 'C:/users/derek';
    });
    
    it('Return job history', function() {
      var expectPath = path.join(process.env.APPDATA, 'HCCGo', 'jobHistory.db');
      expect(filePathService.getJobHistory()).toBe(expectPath);
    });
    
    it('Return Data Path', function() {
      var expectPath = path.join(process.env.APPDATA, 'HCCGo');
      expect(filePathService.getDataPath()).toBe(expectPath);
      
    });
    
    it('Return Submitted Jobs', function() {
      var expectPath = path.join(process.env.APPDATA, 'HCCGo', 'submittedJobs.db');
      expect(filePathService.getSubmittedJobs()).toBe(expectPath);
    });
    
    it('Return Prefrence Path', function() {
      var expectPath = path.join(process.env.APPDATA, 'HCCGo', 'preferences.json');
      expect(filePathService.getPreferencePath()).toBe(expectPath);
    });
    
  });
  
  
  
  
  
  
  
});
