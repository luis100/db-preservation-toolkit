(function() {
  'use strict';

  angular
    .module('app.shared')
    .directive('myFinishRepeat', FinishRepeat);

  function FinishRepeat() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        if (scope.$last) {
            scope.$emit(attrs.myFinishRepeat);
        }
      }
    };
  }

})();

