jobViewModule = angular.module('HccGoApp.jobViewCtrl', ['ngRoute' ]);

jobViewModule.controller('jobViewCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', 'jobService', 'dbService', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, notifierService, jobService, dbService) {

  $scope.params = $routeParams;

}]);
