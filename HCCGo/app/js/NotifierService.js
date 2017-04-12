
notifierModule = angular.module('NotifierModule', ['toastr'])


/**
 * @memberof HCCGo
 * @ngdoc service
 * @class notifierService
 * @param $log {service} AngularJS Logging Service
 * @param $q {service} AngularJS Promise service
 * @param $routeParams {service} AngularJS route parameters
 * @param toastr {service} Toastr notifications
 */
notifierModule.factory('notifierService',['$log', '$q', '$routeParams', 'toastr',
                                           function($log, $q, $routeParams, toastr) {

   const ipcRenderer = require('electron').ipcRenderer;
   const notifier = require('node-notifier');
   var path = require('path');
   var fs = require('fs');

   const toastrOptions = {closeButton: true,
                          timeOut: 5000,
                          extendedTimeOut: 5000,
                          progressBar: true};

	 /**
	 * Get window focus status
	 * To notify user of application dependent on window focus
	 * @memberof HCCGo.notifierService
	 * @function getWinFocus
	 * @returns {Promise} Promise when the focus is established
	 * 
	 */
  var getWinFocus = function() {
    var deferred = $q.defer();
	  ipcRenderer.on('focus-check-message', function(event, arg) {
          $log.debug("Window is focused: " + arg);
		  deferred.resolve(arg);
      });
      ipcRenderer.send('focus-check-reply', 'ping');
	return deferred.promise;
  }

  /**
	 * Pop a success message
	 * @param {String} msg - Message to display 
	 * @param {String} title - Title of message
	 * @memberof HCCGo.notifierService
	 * @function success
	 */
  var success = function(msg, title) {
    getWinFocus().then(function (response) {
      if (response) {
	    toastr.success(msg, title, toastrOptions);
	    } else {
	    notifier.notify({
	      title: title,
  		  message: msg,
  		  icon: path.join(__dirname, '../icons/HCCGo.png'),
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
	
	/**
	 * Pop a warning message
	 * @param {String} msg - Message to display 
	 * @memberof HCCGo.notifierService
	 * @function warning
	 */
  var warning = function(msg) {
    getWinFocus().then(function (response) {
      if (response) {
	    toastr.warning(msg, toastrOptions);
	  } else {
	    notifier.notify({
	      title: 'Warning!',
		  message: msg,
		  icon: path.join(__dirname, '../icons/HCCGo.png'),
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

	/**
	 * Pop a error message
	 * @param {String} msg - Message to display
	 * @param {String} title - Title of message
	 * @memberof HCCGo.notifierService
	 * @function error
	 */
  var error = function(msg, title) {
    getWinFocus().then(function (response) {
      if (response) {
	    toastr.error(msg, title, toastrOptions);
	  } else {
	    notifier.notify({
	      title: title,
		  message: msg,
		  icon: path.join(__dirname, '../icons/HCCGo.png'),
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
