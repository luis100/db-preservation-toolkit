(function() {
  'use strict';

  angular
    .module('app')
    .config(function($routeProvider) {
      $routeProvider
        .when('/', {
          templateUrl: 'angular-app/components/dashboard/dashboardView.html',
          // controller: 'DashboardController',
          // controllerAs: 'dashboard'
        })
        .when('/explore', {
          templateUrl: 'angular-app/components/table/tableView.html',
        })
        .otherwise({ redirectTo: '/' });
    });
})();
