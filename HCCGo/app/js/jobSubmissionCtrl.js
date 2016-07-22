
jobSubmissionModule = angular.module('HccGoApp.jobSubmissionCtrl', ['ngRoute', 'toastr' ]);

jobSubmissionModule.controller('jobSubmissionCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', 'toastr', 'jobService', 'filePathService', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager, toastr, jobService, filePathService) {

  $scope.params = $routeParams;

  // get path to work directory
  var getWork = function() {
    var deferred = $q.defer();

    connectionService.runCommand('echo $WORK').then(function(data) {

      deferred.resolve(data.trim());

    })

    return deferred.promise;

  }

  var loadedJob = jobService.getJob();

  if(loadedJob == null) {
    getWork().then(function(workPath) {
      workPath = workPath + "/";
      $scope.job = {location: workPath, error: workPath, output: workPath};
    });
  }
  else {
    $scope.job =
    {
      runtime: loadedJob.runtime,
      memory: loadedJob.memory,
      jobname: loadedJob.jobname,
      location: loadedJob.location,
      error: loadedJob.error,
      output: loadedJob.output,
      commands: loadedJob.commands
    };
  }

  // load json file
  var filePath = filePathService.getFilePath();
  var jsonFile;
  $.getJSON(filePath, function(json) {
    jsonFile = json;
  });

  $scope.cancel = function() {
    $location.path("cluster/" + $scope.params.clusterId + "/jobHistory");
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
    selectOnTab: true,
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
    
    // Create string for file
    var jobFile =
      "#!/bin/sh\n" +
      "#SBATCH --time=" + job.runtime + "\n" +
      "#SBATCH --mem-per-cpu=" + job.memory + "\n" +
      "#SBATCH --job-name=" + job.jobname + "\n" +
      "#SBATCH --error=" + job.error + "\n" +
      "#SBATCH --output=" + job.output + "\n";
      if(job.modules != null){
          for(var i = 0; i < job.modules.length; i++) {
              jobFile += "\nmodule load " + job.modules[i];
          }
      }

      jobFile += "\n" + job.commands + "\n";

    var now = Date.now();
    // updating job history
    if(loadedJob != null) {
      jsonFile.jobs[loadedJob.id].timestamp = now;
      jsonFile.jobs[loadedJob.id].runtime = job.runtime;
      jsonFile.jobs[loadedJob.id].memory = job.memory;
      jsonFile.jobs[loadedJob.id].jobname = job.jobname;
      jsonFile.jobs[loadedJob.id].location = job.location;
      jsonFile.jobs[loadedJob.id].error = job.error;
      jsonFile.jobs[loadedJob.id].output = job.output;
      jsonFile.jobs[loadedJob.id].modules = ((job.modules != null) ? job.modules : []);
      jsonFile.jobs[loadedJob.id].commands = job.commands;
    }
    else {
      var newId = jsonFile.jobs[jsonFile.jobs.length-1].id + 1;
      var newJob = {
        "id": newId,
        "runtime": job.runtime,
        "memory": job.memory,
        "jobname": job.jobname,
        "location": job.location,
        "error": job.error,
        "output": job.output,
        "modules": ((job.modules != null) ? job.modules : []),
        "commands": job.commands,
        "timestamp": now
      }
      jsonFile.jobs.push(newJob);
    }
    var fs = require("fs");
    fs.writeFile(filePath, JSON.stringify(jsonFile, null, 2), function(err) {
      if(err) {
        return console.error(err);
      }
      else {
        console.log("History written successfully.");
      }
    });
    
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
          callback(null);
        }, function(err) {
          callback(new Error("Job submission failed!"))
        });
        
      }
      
    ], function(err, result) {
      // If there has been an error in the series
      if (err) {
        toastr.error('There was an error in submitting your job to the cluster!', 'Job Submission Failed!', {
          closeButton: true
        });
        $("#submitbtn").prop('disabled', false);
        var curValue = 0;
        $('#submitprogress').css('width', curValue+'%').attr('aria-valuenow', curValue);
      } else {
        // Everything was successful!
        toastr.success('Your job was succesfully submitted to the cluster!', 'Job Submitted!', {
          closeButton: true
        });
        $location.path("cluster/" + $scope.params.clusterId);
      }
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
            $log.error("Got error from checking writability: " + err);
          }
          def.reject();
        });
        return def.promise;
      };
    }
  };
});
