
clusterLandingModule = angular.module('HccGoApp.clusterLandingCtrl', ['ngRoute' ]);

clusterLandingModule.controller('clusterLandingCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager) {

  $scope.params = $routeParams;
  var clusterInterface = null;

  $scope.logout = function() {

    $location.path("/");

  }

  $scope.jobSubmission = function() {

    $location.path("cluster/" + $scope.params.clusterId + "/jobSubmission");

  }

  function getClusterStats(clusterId) {

    // Query the connection service for the cluster
    clusterInterface.getJobs().then(function(data) {
      // Process the data

      $scope.numRunning = data.numRunning;
      $scope.numIdle = data.numIdle;
      $scope.numError = data.numError;
      $scope.jobs = data.jobs;


    }, function(error) {
      console.log("Error in CTRL: " + error);
    })

    clusterInterface.getStorageInfo().then(function(data) {


      var homeUsageGauge = c3.generate({
        bindto: '#homeUsageGauge',
        data: {
          columns: [
            ['Used', data[0].blocksUsed]
          ],
          type: 'gauge'
        },
        gauge: {
          units: 'Gigabytes',
          label: {
            format: function(value, ratio) {
                return value.toFixed(2);
            }
          },
          max: data[0].blocksQuota,

        },
        color: {
          pattern: [ '#60B044', '#F6C600', '#F97600', '#FF0000' ],
          threshold: {
            values: [30, 60, 90, 100]
          }
        },
        size: {
          height: 180
        }

      });

      var homeUsageGauge = c3.generate({
        bindto: '#workUsageGauge',
        data: {
          columns: [
            ['Used', data[1].blocksUsed]
          ],
          type: 'gauge'
        },
        gauge: {
          units: 'Gigabytes',
          label: {
            format: function(value, ratio) {
                return value.toFixed(2);
            }
          },
          max: data[1].blocksQuota,

        },
        color: {
          pattern: [ '#60B044', '#F6C600', '#F97600', '#FF0000' ],
          threshold: {
            values: [30, 60, 90, 100]
          }
        },
        size: {
          height: 180
        }

      });
      angular.element('#homeUsageGauge').prepend('<h4 class="usage text-center">/home Usage</h4>');
      angular.element('#workUsageGauge').prepend('<h4 class="usage text-center">/work Usage</h4>');

    });


  }

  // Get the username
  function getUsername() {

    connectionService.getUsername().then(function(username) {
      $scope.username = username;
    })

  }

  getUsername();
  preferencesManager.getClusters().then(function(clusters) {
    // Get the cluster type
    var clusterType = $.grep(clusters, function(e) {return e.label == $scope.params.clusterId})[0].type;

    switch (clusterType) {
      case "slurm":
        clusterInterface = new SlurmClusterInterface(connectionService, $q);
        break;
      case "condor":
        clusterInterface = new CondorClusterInterface(connectionService, $q);
        break;
    }

    getClusterStats($scope.params.clusterId);

  })


}]);
