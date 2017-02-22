
jobSubmissionModule = angular.module('HccGoApp.jobSubmissionCtrl', ['ngRoute' ]);

jobSubmissionModule.controller('jobSubmissionCtrl', ['$scope', '$log', '$timeout','$rootScope', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'notifierService', 'jobService', 'dbService', 'jobStatusService', 'analyticsService', function($scope, $log, $timeout, $rootScope, connectionService, $routeParams, $location, $q, preferencesManager, notifierService, jobService, dbService, jobStatusService, analyticsService) {

  $scope.params = $routeParams;

  //initialize editor
  ace.config.set('basePath','lib/ace-builds/src-noconflict');
  var editor = ace.edit("commands");
  editor.setTheme("ace/theme/chrome");
  editor.getSession().setMode("ace/mode/sh");
  editor.setShowPrintMargin(false);

  //enable tooltips
  $('[data-toggle="tooltip"]').tooltip();

  // get path to work directory
  var getWork = function() {
    var deferred = $q.defer();

    connectionService.runCommand('echo $WORK').then(function(data) {

      deferred.resolve(data.trim());

    });

    return deferred.promise;

  }

  // gets the job that was selected from job history
  var loadedJob = jobService.getJob();

  if(loadedJob == null) {
    getWork().then(function(workPath) {
      workPath = workPath + "/";
      $scope.job = {location: workPath, error: workPath, output: workPath};
    });

    // Put a placeholder into the commands editor
    editor.setValue("#SBATCH --option=\"value\"\n\n# Commands\n\necho \"Hello\"");


  }
  else {
    $scope.job =
    {
      runtime: loadedJob.runtime,
      memory: loadedJob.memory,
      jobname: loadedJob.clone ? "Clone of " + loadedJob.jobname : loadedJob.jobname,
      location: loadedJob.location,
      error: loadedJob.error,
      output: loadedJob.output,
      commands: loadedJob.commands
    };
    editor.setValue($scope.job.commands);
  }
  
  // Resolve any instances of $WORK in the error, output, or location 
  // to the actual work directory.
  getWork().then(function(workPath) {
    // Search for $WORK, replace with workPath
    $scope.job.location = $scope.job.location.replace("$WORK", workPath);
    $scope.job.error = $scope.job.error.replace("$WORK", workPath);
    $scope.job.output = $scope.job.output.replace("$WORK", workPath);
    
  });

  $scope.chkDir = function(path, identifier) {
    if (!$scope.job.change) {
      $scope.job.change = [];
    }
    if(path) {
      if(path.search(/^\w*\.\w*$/)!=-1) {
        $scope.job.change[identifier] = true;
      }
      else {
        $scope.job.change[identifier] = false;
      }
    }
  }

  $scope.cancel = function() {
    $location.path("/jobHistory");
  }

  /**
   * Force a refresh of the job statuses.
   *
   */
  $scope.refreshCluster = function() {
    jobStatusService.refreshDatabase($rootScope.clusterInterface, connectionService.connectionDetails.shorthost, true);
  }
  // Get available modules
  function getModules() {
    var deferred = $q.defer();
    // Fetch xml document
    connectionService.runCommand("/util/admin/bin/create_module_xmlfile.sh /util/opt/modulefiles/Core").then(function(xml) {
      var xmlDoc = $.parseXML(xml),
        $xml = $(xmlDoc),
        modArray = new Array();
        // Look through xml to find module name
      $($xml).find('LocalSoftware').each(function() {
        var $LocalSoftware = $(this),
          module = $LocalSoftware.find('Handle').find('HandleKey').text(),
          tmp = new Object();
        tmp.label = module;
        modArray.push(tmp);
      });

      modArray.sort();
      $scope.modules = modArray;
      deferred.resolve($scope.modules);
    });
    return deferred.promise;
  }

  // Selectize field for selecting modules
  var $select = $('#modules').selectize({
    plugins: ['remove_button'],
    labelField: 'label',
    searchField: 'label',
    valueField: 'label',
    maxItems: 30,
    delimiter: ',',
    selectOnTab: false,
  });

  var selectize = $select[0].selectize;

  // Add options
  getModules().then(function(modules) {
    selectize.addOption(modules);
    if(loadedJob != null) {

      // Put adding items in a $timeout to avoid $digest issues when the
      // select element issues a 'change' event.
      $timeout(function() {

        angular.forEach(loadedJob.modules, function(module){
          selectize.addItem(module);
        });
        selectize.refreshOptions(false);
        selectize.refreshItems();

      }, 0);

    }
  });

  // Write a job submission script, pass in form data
  $scope.writeSubmissionScript = function(job) {

    $("#submitbtn").prop('disabled', true);

    // Separate SBATCH options from commands
    job.commands = editor.getValue().replace(/\r\n/, "\n");
    var other = job.commands.split(/\n/);
    var sbatch = [];
    sbatch = other.filter(function(value, index, array) {
      return (value.startsWith("#SBATCH"));
    });
    other = other.filter(function(value, index, array) {
      return (!value.startsWith("#SBATCH"));
    });

    sbatch = sbatch.join("\n");
    other = other.join("\n");

    var getWorkProm = getWork();
    getWorkProm.then(function(wp) {
      for(path in $scope.job.change) {
        if ($scope.job.change[path]) {
          job[path] = wp + '\/' +  $scope.job[path].match(/\w*\.\w*/);
        }
      }

    // Create string for file
    var jobFile =
      "#!/bin/sh\n" +
      "#SBATCH --time=\"" + job.runtime + "\"\n" +
      "#SBATCH --mem-per-cpu=\"" + job.memory + "\"\n" +
      "#SBATCH --job-name=\"" + job.jobname + "\"\n" +
      "#SBATCH --error=\"" + job.error + "\"\n" +
      "#SBATCH --output=\"" + job.output + "\"\n" +
      sbatch;
      if(job.modules != null){
          for(var i = 0; i < job.modules.length; i++) {
              jobFile += "\nmodule load " + job.modules[i];
          }
      }

      jobFile += "\n" + other + "\n";

    var now = Date.now();
    // updating job history
    if(loadedJob != null && !loadedJob.clone) {
      dbService.getJobHistoryDB().then(function(jobHistoryDB) {
        jobHistoryDB.update(
          { _id: loadedJob._id },
          { $set:
            {
              timestamp: now,
              runtime: job.runtime,
              memory: job.memory,
              jobname: job.jobname,
              location: job.location,
              error: job.error,
              output: job.output,
              modules: ((job.modules != null) ? job.modules : []),
              commands: job.commands,
              cluster: connectionService.connectionDetails.shorthost
            }
          },
          {},
          function (err, numReplaced) {
            if(err) console.log("Error updating job history db: " + err);
          }
        );
      });
    }
    else {
      var newJob = {
        "runtime": job.runtime,
        "memory": job.memory,
        "jobname": job.jobname,
        "location": job.location,
        "error": job.error,
        "output": job.output,
        "modules": ((job.modules != null) ? job.modules : []),
        "commands": job.commands,
        "timestamp": now,
        "cluster": connectionService.connectionDetails.shorthost
      }
      dbService.getJobHistoryDB().then(function(jobHistoryDB) {
        jobHistoryDB.insert(newJob, function(err, newDoc) {
          if(err) $log.error(err);
        });
      });
    }

    async = require("async");
    // Call the series of actions to submit a job
    async.series([
      function(callback) {
        // Transfer the input file
        var curValue = 33;
        $('#submitprogress').css('width', curValue+'%').attr('aria-valuenow', curValue);
        $('progresssummary').text("Transferring job file...");
        connectionService.uploadJobFile(jobFile, job.location).then(function(data) {
          callback(null);
        }, function(err) {
          callback(new Error("Upload of file failed!"));
        });
      },
      function(callback) {
        // Submit the job
        var curValue = 66;
        $('#submitprogress').css('width', curValue+'%').attr('aria-valuenow', curValue);
        $('progresssummary').text("Submitting Job...");
        connectionService.submitJob(job.location).then(function(data) {
          // db entry
          var doc = {
            "jobId": data.split(" ")[3].trim(),
            "complete": false,
            "cluster": connectionService.connectionDetails.shorthost,
            "runtime": job.runtime,
            "memory": job.memory,
            "jobname": job.jobname,
            "location": job.location,
            "errorPath": job.error,
            "outputPath": job.output,
            "modules": ((job.modules != null) ? job.modules : []),
            "commands": job.commands,
            "timestamp": now,
            "jobFile": jobFile,
            "status": "SUBMITTED",
            "jobName": job.jobname
          }
          dbService.getSubmittedJobsDB().then(function(submittedJobsDB) {
            submittedJobsDB.insert(doc, function(err, newDoc) {
              if(err) $log.error(err);
              callback(null);
            });
          });
        }, function(err) {
          callback(new Error("Job submission failed!"));
        });

      }

    ], function(err, result) {
      // If there has been an error in the series
      if (err) {
        analyticsService.event('job submission', 'fail');
        notifierService.error('There was an error in submitting your job to the cluster!', 'Job Submission Failed!');
        $("#submitbtn").prop('disabled', false);
        var curValue = 0;
        $('#submitprogress').css('width', curValue+'%').attr('aria-valuenow', curValue);
      } else {
        // Everything was successful!
        analyticsService.event('job submission', 'success');
        notifierService.success('Your job was succesfully submitted to the cluster!', 'Job Submitted!');
        $scope.refreshCluster();
        $location.path("/cluster");
      }
    });
  });

  }


}]);

jobSubmissionModule.directive('remoteWritable', function($q, $log, connectionService) {
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function(scope, elm, attrs, ctrl) {

      ctrl.$asyncValidators.remoteWritable = function(modelValue, viewValue) {
        if (ctrl.$isEmpty(modelValue)) {
          // consider empty model valid
          return $q.when();
        }

        var def = $q.defer();
        $log.debug("Checking file location: " + modelValue);
        connectionService.checkWritable(modelValue).then(function(writability) {

          if (writability) {
            $log.debug("File is writable");
            def.resolve();
          } else {
            $log.debug("File is not writable");
            def.reject();
          }


        }, function(err) {
          if (err) {
            $log.debug("Got error from checking writability: " + err);
          }
          def.reject();
        });
        return def.promise;
      };
    }
  };
});
