(function() {
	'use strict';

	var app = angular.module('dbpresApp', ['ngRoute', 'dbpresControllers', 'dbpresServices']);

	app.config(function($routeProvider) {
		$routeProvider
			.when('/', {
				templateUrl: 'views/dashboard.html',
				// controller: 'DashboardController',
				// controllerAs: 'dashboard'
			})
			.when('/explore', {
				templateUrl: 'views/explore.html',
			})
			.otherwise({ redirectTo: '/' });
	});
})();
