
fileManageService = angular.module('fileManageService', [])

fileManageService.factory('fileManageService',['$log', '$q', '$routeParams', 'connectionService', function($log, $q, $routeParams, connectionService) {
  
   const async = require('async');
   const path = require('path');
   const fs = require('fs');
   
   var service = {};
   var _uploadStatus = false;
   var _boolUp = true;
   var _boolDown = false;
   var _processStatus = true;
   var _localFiles = [];
   var _remoteFiles = [];
   var _homeWD = new String("");
   var _workWD = new String("");
   var _localWD = new String("");
   var _remoteWD = new String("");
   var _remoteFocus = new String("");
   var _localFocus = new String("");
   var _processFinished = false;
   var _userDownAuth = false;
   var _userUpAuth = false;
   var _accuSize = 0;
   var _diskAvail = 0;
   var _diskQuota = 0;
   var _filesTotal = 0;
   var _counter = 0;
   var _totalProgress = 0;

   /**
   * To handle state information for the file management
   *
   */

   service.getTotalProgress = function(){
       return _totalProgress;
   }

   service.setTotalProgress = function(x){
       _totalProgress = x;
       return _totalProgress;
   }

   service.getCounter = function(){
       return _counter;
   }

   service.setCounter = function(x){
       _counter = x;
       return _counter;
   }

   service.getFilesTotal = function(){
       return _filesTotal;
   }

   service.setFilesTotal = function(x){
       _filesTotal = x;
       return _filesTotal;
   }

   service.getDiskQuota = function(){
       return _diskQuota;
   }

   service.setDiskQuota = function(x){
       _diskQuota = x;
       return _diskQuota;
   }

   service.getDiskAvail = function(){
       return _diskAvail;
   }

   service.setDiskAvail = function(x){
       _diskAvail = x;
       return _diskAvail;
   }

   service.getAccuSize = function(){
       return _accuSize;
   }

   service.setAccuSize = function(x){
       _accuSize = x;
       return _accuSize;
   }

   service.getUserDownAuth = function(){
       return _userDownAuth;
   }

   service.setUserDownAuth = function(x){
       _userDownAuth = x;
       return _userDownAuth;
   }

   service.getUserUpAuth = function(){
       return _userUpAuth;
   }

   service.setUserUpAuth = function(x){
       _userUpAuth = x;
       return _userUpAuth;
   }

   service.getProcessFinished = function(){
       return _processFinished;
   }

   service.setProcessFinished = function(x){
       _processFinished = x;
       return _processFinished;
   }

   service.getUploadStatus = function(){
       return _uploadStatus;
   }

   service.setUploadStatus = function(x){
       _uploadStatus = x;
       return _uploadStatus;
   }

   service.getBoolUp = function(){
       return _boolUp;
   }

   service.getBoolDown = function(){
       return _boolDown;
   }

   service.getProcessStatus = function(){
       return _processStatus;
   }

   service.setProcessStatus = function(x){
       _processStatus = x;
       return _processStatus;
   }

   service.getLocalFiles = function(){
       return _localFiles;
   }

   service.setLocalFiles = function(x){
       _localFiles = x;
       return _localFiles;
   }

   service.getRemoteFiles = function(){
       return _remoteFiles;
   }

   service.setRemoteFiles = function(x){
       _remoteFiles = x;
       return _remoteFiles;
   }

   service.getHomeWD = function(){
       return _homeWD;
   }

   service.setHomeWD = function(x){
       _homeWD = x;
       return _homeWD;
   }

   service.getWorkWD = function(){
       return _workWD;
   }

   service.setWorkWD = function(x){
       _workWD = x;
       return _workWD;
   }

   service.getLocalWD = function(){
       return _localWD;
   }

   service.setLocalWD = function(x){
       _localWD = x;
       return _localWD;
   }

   service.getRemoteWD = function(){
       return _remoteWD;
   }

   service.setRemoteWD = function(x){
       _remoteWD = x;
       return _remoteWD;
   }

   service.getRemoteFocus = function(){
       return _remoteFocus;
   }

   service.setRemoteFocus = function(x){
       _remoteFocus = x;
       return _remoteFocus;
   }

   service.getLocalFocus = function(){
       return _localFocus;
   }

   service.setLocalFocus = function(x){
       _localFocus = x;
       return _localFocus;
   }
  
   return service;
  
}]);
