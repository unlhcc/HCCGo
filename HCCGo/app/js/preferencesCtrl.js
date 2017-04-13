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

  var $selector = $('#schedulerSelect').selectize({
    createOnBlur: true,
    labelField: 'label',
    searchField: 'label',
    valueField: 'value',
    selectOnTab: true
  });

  var selection = $selector[0].selectize;
  var schedulers = [{"label":"Slurm", "value":"slurm"},{"label":"Condor", "value":"condor"}];
  selection.addOption(schedulers);
  selection.addItem(schedulers[0].value, false);
  selection.refreshOptions(false);
  selection.refreshItems();

}]);
