
jobSubmissionModule = angular.module('HccGoApp.jobSubmissionCtrl', ['ngRoute' ]);

jobSubmissionModule.controller('jobSubmissionCtrl', ['$scope', '$log', '$timeout', 'connectionService', '$routeParams', '$location', '$q', 'preferencesManager', function($scope, $log, $timeout, connectionService, $routeParams, $location, $q, preferencesManager) {

  $scope.params = $routeParams;

  $scope.logout = function() {

    $location.path("/");

  }

  // Get the username
  function getUsername() {

    connectionService.getUsername().then(function(username) {
      $scope.username = username;
    })

  }
  getUsername();

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
    selectize.refreshOptions(false);
    selectize.refreshItems();
  });

  // Write a job submission script, pass in form data
  $scope.writeSubmissionScript = function(job) {

    var filepath = "files/job.slurm";

    // Create string for file
    var jobFile =
      "#!/bin/sh\n" +
      "#SBATCH --time=" + job.runtime + "\n" +
      "#SBATCH --mem-per-cpu=" + job.memory + "\n" +
      "#SBATCH --job-name=" + job.jobname + "\n" +
      "#SBATCH --error=" + job.error + "\n" +
      "#SBATCH --output=" + job.output + "\n\n";
      if(typeof job.modules !== 'undefined'){
          for(var i = 0; i < job.modules.length; i++) {
              jobFile += "module load " + job.modules[i] + "\n";
          }
      }

      jobFile += "\n" + job.commands;

    console.log("The generated file:\n")
    console.log("#!/bin/sh\n");
    console.log("#SBATCH --time=" + job.runtime + "\n");
    console.log("#SBATCH --mem-per-cpu=" + job.memory + "\n");
    console.log("#SBATCH --job-name=" + job.jobname + "\n");
    console.log("#SBATCH --error=" + job.error + "\n");
    console.log("#SBATCH --output=" + job.output + "\n\n");
    if(typeof job.modules !== 'undefined'){
        for(var i = 0; i < job.modules.length; i++) {
            console.log("module load " + job.modules[i] + "\n");
        }
    }
    console.log("\n");
    console.log(job.commands);
    // Send data to ConnectionService for file upload
    connectionService.uploadJobFile(jobFile, job.location).then(function (data) {
      // Do something
    });
  }


}]);
