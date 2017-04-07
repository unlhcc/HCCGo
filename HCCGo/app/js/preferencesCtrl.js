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

  var $selector = $('#clusterSelect').selectize({

    createOnBlur: true,
    labelField: 'label',
    searchField: 'label',
    valueField: 'url',
    selectOnTab: true,
    render: {
      'option': function(data, escape) {
            return '<div><span class="clusterLabel">' + escape(data.label) + '</span>' + '<span class="url">' + escape(data.url) + '</span></div>';
        },
       'option_create': function(data, escape) {
         return '<div class="create">Hostname: <strong>' +  escape(data.input) + '</strong>&hellip;</div>';
       }
     },
     create: function(input, callback) {
       new_object = {}
       new_object.label = input.split(".")[0];
       new_object.url = input;
       new_object.type = 'slurm';
       $scope.clusters.push(new_object);
       callback(new_object);

     }

  });

  var selection = $selector[0].selectize;

}]);
