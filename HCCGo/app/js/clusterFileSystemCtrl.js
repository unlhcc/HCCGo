
clusterUploadModule = angular.module('HccGoApp.clusterFileSystemCtrl', ['ngRoute' ]);

clusterUploadModule.controller('clusterFileSystemCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', 'fileManageService', 
                                                         function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, notifierService, fileManageService) {

   // Initialization functions
   $scope.params = $routeParams; 
   $scope.fileManage = fileManageService;
   if (fileManageService.localFocus != "") {
      angular.element("#l" + fileManageService.localFocus.replace(/\./g, "\\.")).addClass('highlight');
   } else if (fileManageService.remoteFocus != "") {
      angular.element("#r" + fileManageService.remoteFocus.replace(/\./g, "\\.")).addClass('highlight');
   }

   /*$scope.$watch(function(scope) {
                     return( fileManageService.localFiles );
                 },
                 function(newValue, oldValue) { 
				     $log.debug("The files have changed");
			    });*/
   $scope.focusFile = fileManageService.focus;
}]);

clusterUploadModule.filter('humanReadable', function() {

  return function(bytes, si) { 
    if(isNaN(bytes)) {
      return bytes;
    }
    else {
      var thresh = si ? 1000 : 1024;
      if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
      }
      var units = si
      ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
      : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
      var u = -1;
      do {
        bytes /= thresh;
        ++u;
      } while(Math.abs(bytes) >= thresh && u < units.length - 1);
      return bytes.toFixed(1)+' '+units[u];
    }
  }
});
