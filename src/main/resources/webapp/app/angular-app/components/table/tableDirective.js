(function() {
  'use strict';

  angular
    .module('app.table')
    .directive('myColResize', ColumnResize);

  function ColumnResize() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        scope.$on('table-finish-repeat', function(e) {
          // angular.element(element).resizableColumns();
        });
      }
    };
  }
})();