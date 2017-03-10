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
                              'HccGoApp.preferencesCtrl',
                              'filePathService',
							                'navService',
                              'fileManageService',
                              'dbService',
                              'updaterModule',
                              'HccGoApp.updatePageCtrl',
                              'HccGoApp.NavCtrl',
                              'dataUsageService',
                              'jobStatusService',
                              'preferencesService',
                              'AnalyticsModule',
                              'HccGoApp.tutorialCtrl']).config([
  '$routeProvider', function($routeProvider) {
    return $routeProvider.when('/', {
      title: 'Welcome',
      templateUrl: 'html/welcome.html',
      controller: 'welcomeCtrl'
    }).when('/cluster/', {
      title: 'Dashboard',
      templateUrl: 'html/clusterLanding.html',
      controller: 'clusterLandingCtrl'
    }).when('/filesystem', {
      title: 'Filesystem',
      templateUrl: 'html/clusterFileSystem.html',
      controller: 'clusterFileSystemCtrl'
    }).when('/jobSubmission', {
      title: 'Job Submission',
      templateUrl: 'html/jobSubmission.html',
      controller: 'jobSubmissionCtrl'
    }).when('/jobHistory', {
      title: 'Job History',
      templateUrl: 'html/jobHistory.html',
      controller: 'jobHistoryCtrl'
    }).when('/jobview/:jobId', {
      title: 'Job View',
      templateUrl: 'html/jobView.html',
      controller: 'jobViewCtrl'
    }).when('/update', {
      title: 'Update',
      templateUrl: 'html/update.html',
      controller: 'updatePageCtrl'
    }).when('/tutorials', {
      title: 'Tutorials',
      templateUrl: 'html/tutorials.html',
      controller: 'tutorialCtrl'
    }).when('/preferences', {
      title: 'Preferences',
      templateUrl: 'html/preferences.html',
      controller: 'preferencesCtrl'
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
