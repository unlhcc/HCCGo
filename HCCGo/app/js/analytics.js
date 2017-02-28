/*
 * name: nwjs-analytics -Node-Webkit Google Analytics integration
 * version: 1.0.2
 * github: https://github.com/Daaru00/nwjs-analytics
 */


 AnalyticsModule = angular.module('AnalyticsModule', [])

 AnalyticsModule.factory('analyticsService',['$log', '$q', 'preferencesManager', function($log, $q, preferencesManager) {

    var apiVersion = '1';
    var trackID = 'UA-90202403-1';
    var clientID = null;
    var userID = null;
  	var appName = 'HCCGo';
  	var appVersion = '0.3.1';
  	var debug = false;
  	var performanceTracking = true;
  	var errorTracking = true;
  	var userLanguage = "en";
    var currency = "USD";
    var lastScreenName = '';

    clientDefer = $q.defer();

    preferencesManager.getPreferences().then(function(pref) {
      clientDefer.resolve(pref.uuid);
      this.clientID = pref.uuid;
    });



    var sendRequest = function(data, callback) {
        clientDefer.promise.then(function(clientId) {
            clientID = clientId;
            _sendRequest(data, callback);
        })
    }


    var _sendRequest = function(data, callback) {

        if(!this.clientID || this.clientID == null)
            this.clientID = generateClientID();

        if(!this.userID || this.userID == null)
            this.userID = generateClientID();

        var postData = "v="+apiVersion
                        +"&tid="+trackID
                        +"&cid="+clientID
                        +"&uid="+userID
                        +"&an="+appName
                        +"&av="+appVersion
                        +"&sr="+getScreenResolution()
                        +"&vp="+getViewportSize()
                        +"&sd="+getColorDept()
                        +"&ul="+this.userLanguage
                        +"&ua="+getUserAgent()
                        +"&ds=app";

        Object.keys(data).forEach(function(key) {
            var val = data[key];
            if(typeof val != "undefined")
                postData += "&"+key+"="+val;
        });

        var http = new XMLHttpRequest();
        var url = "https://www.google-analytics.com";
        if(!this.debug)
            url += "/collect";
        else
            url += "/debug/collect";

        http.open("POST", url, true);

        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        http.onreadystatechange = function() {
            if(this.debug)
                console.log(http.response);

            if(http.readyState == 4 && http.status == 200) {
                if(callback)
                    callback(true);
            }
            else
            {
                if(callback)
                    callback(false);
            }
        }
        http.send(postData);
    }

    var generateClientID = function()
    {
        var id = "";
        var possibilities = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for( var i=0; i < 5; i++ )
            id += possibilities.charAt(Math.floor(Math.random() * possibilities.length));
        return id;
    }

    var getScreenResolution = function(){
        return screen.width+"x"+screen.height;
    }

    var getColorDept = function(){
        return screen.colorDepth+"-bits";
    }

    var getUserAgent = function(){
        return navigator.userAgent;
    }

    var getViewportSize = function(){
        return window.screen.availWidth+"x"+window.screen.availHeight;
    }

    /*
     * Measurement Protocol
     * [https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide]
     */

    var screenView = function(screename){
        var data = {
			't' : 'screenview',
			'cd' : screename
		}
		sendRequest(data);
        this.lastScreenName = screename;
    }

    var event = function(category, action, label, value){
        var data = {
			't' : 'event',
			'ec' : category,
			'ea' : action,
			'el' : label,
			'ev' : value,
            'cd' : this.lastScreenName,
		}
		sendRequest(data);
    }

    var exception = function(msg, fatal){
        var data = {
			't' : 'exception',
			'exd' : msg,
			'exf' : fatal || 0
		}
		sendRequest(data);
    }

    var timing = function(category, variable, time, label){

        var data = {
			't' : 'timing',
			'utc' : category,
			'utv' : variable,
			'utt' : time,
			'utl' : label,
		}
		sendRequest(data);
    }

    var ecommerce = {
        transactionID: false,
        generateTransactionID: function()
        {
            var id = "";
            var possibilities = "0123456789";
            for( var i=0; i < 5; i++ )
                id += possibilities.charAt(Math.floor(Math.random() * possibilities.length));
            return id;
        },
        transaction: function(total, items){
            var t_id = "";
            if(!this.ecommerce.transactionID)
                t_id = this.ecommerce.generateTransactionID();
            else
                t_id = this.ecommerce.transactionID;

            var data = {
                't' : 'transaction',
                'ti' : t_id,
                'tr' : total,
                'cu' : this.currency,
            }
            this.sendRequest(data);

            items.forEach(function(item){
                var data = {
                    't' : 'item',
                    'ti' : t_id,
                    'in' : item.name,
                    'ip' : item.price,
                    'iq' : item.qty,
                    'ic' : item.id,
                    'cu' : this.currency
                }
                this.sendRequest(data);
            })
        }
    }

    var custom = function(data){
        this.sendRequest(data);
    }







/*
 * Performance Tracking
 */

window.addEventListener("load", function() {

    if(this.performanceTracking)
    {
        setTimeout(function() {
            var timing = window.performance.timing;
            var userTime = timing.loadEventEnd - timing.navigationStart;

            this.timing("performance", "pageload", userTime);

          }, 0);
    }

}, false);

/*
 * Error Reporting
 */

window.onerror = function (msg, url, lineNo, columnNo, error) {
    var message = [
        'Message: ' + msg,
        'Line: ' + lineNo,
        'Column: ' + columnNo,
        'Error object: ' + JSON.stringify(error)
    ].join(' - ');

    if(this.errorTracking)
    {
        setTimeout(function() {
            this.exception(message.toString());
        }, 0);
    }

    return false;
};

return {
    sendRequest: sendRequest,
    screenView: screenView,
    event: event,
    exception: exception,
    timing: timing,
    ecommerce: ecommerce
}

}]);
