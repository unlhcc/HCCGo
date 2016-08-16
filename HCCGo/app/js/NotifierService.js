
notifierModule = angular.module('NotifierModule', ['toastr'])

notifierModule.factory('notifierService',['$log', '$q', '$routeParams', 'toastr', 
                                           function($log, $q, $routeParams, toastr) {
  
   const {ipcRenderer} = require('electron');
   const notifier = require('node-notifier');
   var path = require('path');
   var fs = require('fs');
   
   const toastrOptions = {closeButton: true,
                          timeOut: 5000,
                          extendedTimeOut: 5000,
                          progressBar: true};
   
   /**
   * To notify user of application dependent on window focus
   *
   */
   
  // Get window focus status
  var getWinFocus = function() {
    var deferred = $q.defer();
	  ipcRenderer.on('focus-check-message', (event, arg) => {
          $log.debug("Window is focused: " + arg);
		  deferred.resolve(arg);
      });
      ipcRenderer.send('focus-check-reply', 'ping');
	return deferred.promise;
  }  
   
  // Pop a success message
  var success = function(msg, title) {
    getWinFocus().then(function (response) {
      if (response) {
	    toastr.success(msg, title, toastrOptions);
	  } else {
	    notifier.notify({
	      title: title,
		  message: msg,
		  icon: void 0,
		  sound: false,
		  wait: false
	    }, function (err, response) {
	      if (err) {
		    $log.debug(err);
		  }
	    })
	  }
	});
  }

  // Pop a warning message
  var warning = function(msg) {
    getWinFocus().then(function (response) {
      if (response) {
	    toastr.warning(msg, toastrOptions);
	  } else {
	    notifier.notify({
	      title: 'Warning!',
		  message: msg,
		  icon: void 0,
		  sound: false,
		  wait: false
	    }, function (err, response) {
	      if (err) {
		    $log.debug(err);
		  }
	    })
	  }
	});
  }

  // Pop a error message
  var error = function(msg, title) {
    getWinFocus().then(function (response) {
      if (response) {
	    toastr.error(msg, title, toastrOptions);
	  } else {
	    notifier.notify({
	      title: title,
		  message: msg,
		  icon: void 0,
		  sound: false,
		  wait: false
	    }, function (err, response) {
	      if (err) {
		    $log.debug(err);
		  }
	    })
	  }
	});
  }
  
  return {
  success: success,
  warning: warning,
  error: error
  }
  
}]);
