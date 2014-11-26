(function() {
  'use strict';
  
  angular
    .module('app')
    .service('UtilsService', UtilsService);

  function UtilsService() {
    this.myStartsWith = function(str) {
      return this.indexOf(str) === 0;
    };
    
    this.objectSize = function(obj) {
      var size = 0,
        key;
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          size++;
        }
      }
      return size;
    };
  }
})();