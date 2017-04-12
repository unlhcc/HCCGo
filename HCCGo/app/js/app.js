var app = angular.module('HccGoApp', ['HccGoApp.WelcomeCtrl',
                              'ngRoute',
                              'ngAnimate',
                              'ConnectionServiceModule',
							  'NotifierModule',
                              'HccGoApp.clusterLandingCtrl',
                              'PreferencesManager',
                              'HccGoApp.clusterFileSystemCtrl',
                              'HccGoApp.jobSubmissionCtrl',
                              'HccGoApp.jobHistoryCtrl',
                              'HccGoApp.jobViewCtrl',
                              'filePathService',
							  'navService',
                              'fileManageService',
                              'dbService',
                              'updaterModule',
                              'HccGoApp.updatePageCtrl',
                              'HccGoApp.NavCtrl', 'dataUsageService', 'jobStatusService',
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
    }).otherwise({
      redirectTo: '/'
    });
  }
]);

app.run(['$rootScope', '$route', 'analyticsService', '$location', function($rootScope, $route, analyticsService, $location) {
    $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
        if($route.current.title) analyticsService.screenView($route.current.title); //screenView value is Dashboard
        $rootScope.title = current.$$route.title;
        if ($location.path() == '/') {
          $rootScope.showSidebar = false;
        } else {
          $rootScope.showSidebar = true;
        }
        
    });
}]);
