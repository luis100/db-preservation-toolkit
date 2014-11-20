(function() {
  'use strict';

  angular
    .module('app')
    .config(function($routeProvider) {
      $routeProvider
        .when('/', {
          templateUrl: 'app/components/dashboard/dashboardView.html',
          // controller: 'DashboardController',
          // controllerAs: 'dashboard'
        })
        .when('/explore', {
          templateUrl: 'app/components/table/tableView.html',
        })
        .otherwise({ redirectTo: '/' });
  });
})();
