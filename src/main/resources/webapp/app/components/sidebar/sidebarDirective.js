(function() {
  'use strict';

  angular
    .module('app.sidebar')
    .directive('myMetismenu', MetisMenuDirective);

  function MetisMenuDirective() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        scope.$on('sidebar-finish-repeat', function(e) {
          angular.element(element).metisMenu();
        });
      }
    };
  }

})();