filePathService = angular.module('filePathService', []);
filePathService.service('filePathService', function() {

  var dataPath = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/' : process.env.HOME);
  var path = require('path');
  dataPath = path.join(dataPath, 'HCCGo');
  var filePath = path.join(dataPath, 'jobHistory.json');
  return {
    getFilePath: function() {
      return filePath;
    },
    getDataPath: function() {
      return dataPath;
    }
  };

});
