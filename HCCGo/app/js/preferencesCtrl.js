preferencesModule = angular.module('HccGoApp.preferencesCtrl', ['ngRoute' ]);

/**
 * This controller is responsible for displaying the current settings and updating
 * them when the user makes changes.
 *
 * @ngdoc controller
 * @memberof HCCGo
 * @class preferencesCtrl
 * @requires $scope
 * @requires $log
 * @requires preferencesManager
 */
preferencesModule.controller('preferencesCtrl', ['$scope', '$log', 'preferencesManager', function($scope, $log, preferencesManager) {

  preferencesManager.getPreferences().then(function(data) {
    $scope.uuid = data.uuid;
  });
  
}]);
