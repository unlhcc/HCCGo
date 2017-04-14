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
preferencesModule.controller('preferencesCtrl', ['$scope', '$log', 'preferencesManager', 'notifierService', function($scope, $log, preferencesManager, notifierService) {

  preferencesManager.getPreferences().then(function(data) {
    $scope.uuid = data.uuid;
  });

  var $selector = $('#schedulerSelect').selectize({
    labelField: 'label',
    searchField: 'label',
    valueField: 'value',
    selectOnTab: true
  });

  var selection = $selector[0].selectize;
  var schedulers = [{"label":"Slurm", "value":"slurm"},{"label":"Condor", "value":"condor"}];
  selection.addOption(schedulers);
  preferencesManager.getPreferences().then(function(data) {
    selection.addItem(data.scheduler, true);
  });

  selection.refreshOptions(false);
  selection.refreshItems();

  // on change update scheduler
  selection.on("change", function(value) {
    selection.disable();
    var preference = {"scheduler": value}
    preferencesManager.setPreferences(preference).then(function(data) {
      schedulerChange = value;
      selection.enable();
      notifierService.success('You successfully changed to ' + value, 'Schedular Changed!');
    },
    function(data) {
      selection.enable();
      notifierService.error('An error occurred while trying to change schedulars' , 'Schedular Change Error!');
    });
  });
}]);
