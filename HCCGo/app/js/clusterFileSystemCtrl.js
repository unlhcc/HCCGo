
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

   $scope.$watch(function() { return fileManageService.localFiles },
                 function() { $timeout(function() {
                                       }, 2000); });

}]);
