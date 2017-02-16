
clusterUploadModule = angular.module('HccGoApp.clusterFileSystemCtrl', ['ngRoute' ]);

clusterUploadModule.controller('clusterFileSystemCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', 'fileManageService', 
                                                         function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, notifierService, fileManageService) {

   // Initialization functions
   $scope.params = $routeParams; 
   $scope.fileManage = fileManageService;
   $scope.focusFile = {};
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
   $scope.findHighlighted = function(file, place) {

     $scope.focusFile = fileManageService[place].find(function(x) {return file === x.name});
   }
}]);
