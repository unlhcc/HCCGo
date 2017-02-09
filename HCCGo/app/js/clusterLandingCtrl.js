
clusterLandingModule = angular.module('HccGoApp.clusterLandingCtrl', ['ngRoute' ]);

clusterLandingModule.controller('clusterLandingCtrl', ['$scope', '$log', '$timeout','$rootScope', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'filePathService', 'notifierService', 'dbService', 'dataUsageService','jobStatusService', function($scope, $log, $timeout, $rootScope, connectionService, $routeParams, $location, $q, preferencesManager, filePathService, notifierService, dbService, dataUsageService, jobStatusService) {

  $scope.params = $routeParams;
  $scope.jobs = [];
  var clusterInterface = null;

  // Generate empty graphs
  var homeUsageGauge = c3.generate({
    bindto: '#homeUsageGauge',
    data: {
      columns: [
        ['Used', 0]
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
      max: 0,

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

  var workUsageGauge = c3.generate({
    bindto: '#workUsageGauge',
    data: {
      columns: [
        ['Used', 0]
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
      max: 0,

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


  // Nav to jobHistory
  $scope.jobHistory = function() {
     $location.path("cluster/" + $scope.params.clusterId + "/jobHistory");
  }

  $scope.refreshCluster = function(force=false) {
    getClusterStats($scope.params.clusterId, force);

  }

  $scope.updateGraphs = function(force) {
    updateGraphs(force);
  }

  $scope.removeCompletedJob = function(id, $event) {
    // deletes the document from db and removes it from list
    for(var i = 0; i < $scope.jobs.length; i++) {
      if($scope.jobs[i]._id == id) {
        $scope.jobs.splice(i, 1);
        break;
      }
    }
    dbService.getSubmittedJobsDB().then(function(db) {
      db.remove({ _id: id }, { multi: true }, function (err, numRemoved) {
        if(err) console.log("Error deleting document " + err);
      });
    });
    $event.stopPropagation();
  }

  $scope.viewOutErr = function(id) {
    // view the selected job's stander out and err
    $location.path("cluster/" + $routeParams.clusterId + "/jobview/" + id);
  }

  function getClusterStats(clusterId, force) {

    // Begin spinning the refresh image
    $("#jobrefresh").addClass("spinning-image");
    $scope.loading = true;

    jobStatusService.refreshDatabase(clusterInterface, clusterId, force).then(function(data) {
      $scope.numRunning = data.numRunning;
      $scope.numIdle = data.numIdle;
      $scope.numError = data.numError;
      $scope.jobs = data.jobs;

      // Stop spinning image
      $("#jobrefresh").removeClass("spinning-image");
      $scope.loading = false;
    });
  }

  function updateGraphs(force) {

      $("#homeUsageGauge").addClass("loading");
      $("#workUsageGauge").addClass("loading");
      $("#graphrefresh").addClass("spinning-image");

      dataUsageService.getDataUsage(clusterInterface, force).then(function(data) {

        $("#homeUsageGauge").removeClass("loading");
        $("#workUsageGauge").removeClass("loading");
        $("#graphrefresh").removeClass("spinning-image");

        homeUsageGauge.load({
            columns: [
              ['Used', data[0].blocksUsed]
            ]
        });

        // POSSIBLE FUTURE DEPRECATION: Messing with interals instead of using load function
        homeUsageGauge.internal.config.gauge_max = data[0].blocksQuota;

        workUsageGauge.load({
            columns: [
              ['Used', data[1].blocksUsed]
            ]
        });

        // POSSIBLE FUTURE DEPRECATION: Messing with interals instead of using load function
        workUsageGauge.internal.config.gauge_max = data[1].blocksLimit;
    });
  }
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
    $rootScope.clusterInterface = clusterInterface;
    $rootScope.clusterId = $scope.params.clusterId;

    // Update the cluster every 15 seconds
    var refreshingClusterPromise;
    var isRefreshingCluster = false;
    $scope.startRefreshingCluster = function(){
      if(isRefreshingCluster) return;
      isRefreshingCluster = true;
      (function refreshEvery(){
        //Do refresh
        getClusterStats($scope.params.clusterId);
        //If async in then in callback do...
        refreshingClusterPromise = $timeout(refreshEvery,15000);
      }());
    };
    $scope.$on('$destroy',function(){
      if(refreshingClusterPromise) {
        $timeout.cancel(refreshingClusterPromise);
      }
    });

    // Update the graphs every 5 minutes
    var refreshingGraphsPromise;
    var isRefreshingGraphs = false;
    $scope.startRefreshingGraphs = function(){
      if(isRefreshingGraphs) return;
      isRefreshingGraphs = true;
      (function refreshEvery() {
        updateGraphs();
        refreshingGraphsPromise = $timeout(refreshEvery, 300000);
      }());
    };
    $scope.$on('$destroy', function() {
      if (refreshingGraphsPromise) {
        $timeout.cancel(refreshingGraphsPromise);
      }
    });

    $scope.startRefreshingCluster();
    $scope.startRefreshingGraphs();
  });


}]);
