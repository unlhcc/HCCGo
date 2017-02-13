var app = angular.module('HccGoApp', ['HccGoApp.WelcomeCtrl',
                              'ngRoute',
                              'ConnectionServiceModule',
							  'NotifierModule',
                              'HccGoApp.clusterLandingCtrl',
                              'PreferencesManager',
                              'HccGoApp.clusterFileSystemCtrl',
                              'HccGoApp.jobSubmissionCtrl',
                              'HccGoApp.jobHistoryCtrl',
                              'HccGoApp.jobViewCtrl',
                              'filePathService',
                              'fileManageService',
                              'dbService',
                              'updaterModule',
                              'HccGoApp.updatePageCtrl',
                              'HccGoApp.NavCtrl', 'dataUsageService', 'jobStatusService',
                              'AnalyticsModule']).config([
  '$routeProvider', function($routeProvider) {
    return $routeProvider.when('/', {
      title: 'Welcome',
      templateUrl: 'html/welcome.html',
      controller: 'welcomeCtrl'
    }).when('/cluster/:clusterId', {
      title: 'Dashboard',
      templateUrl: 'html/clusterLanding.html',
      controller: 'clusterLandingCtrl'
    }).when('/cluster/:clusterId/filesystem', {
      title: 'Filesystem',
      templateUrl: 'html/clusterFileSystem.html',
      controller: 'clusterFileSystemCtrl'
    }).when('/cluster/:clusterId/jobSubmission', {
      title: 'Job Submission',
      templateUrl: 'html/jobSubmission.html',
      controller: 'jobSubmissionCtrl'
    }).when('/cluster/:clusterId/jobHistory', {
      title: 'Job History',
      templateUrl: 'html/jobHistory.html',
      controller: 'jobHistoryCtrl'
    }).when('/cluster/:clusterId/jobview/:jobId', {
      title: 'Job View',
      templateUrl: 'html/jobView.html',
      controller: 'jobViewCtrl'
    }).when('/update', {
      title: 'Update',
      templateUrl: 'html/update.html',
      controller: 'updatePageCtrl'
    }).otherwise({
      redirectTo: '/'
    });
  }
]);

app.run(['$rootScope', '$route', 'analyticsService', function($rootScope, $route, analyticsService) {
    $rootScope.$on('$routeChangeSuccess', function() {
        if($route.current.title) analyticsService.screenView($route.current.title); //screenView value is Dashboard
    });
}]);
