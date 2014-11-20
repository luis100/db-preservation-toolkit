(function() {
  'use strict';

  angular
    .module('app.shared')
    .directive('myFinishRepeat', FinishRepeat);

  function FinishRepeat($timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        console.log("outside");
        if (scope.$last) {
            scope.$emit(attrs.myFinishRepeat);
        }
      }
    };
  }

})();

