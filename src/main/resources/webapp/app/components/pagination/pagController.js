(function() {
  'use strict';
  
  angular
    .module('app.pagination')
    .controller('PagController', PagController);
  
  PagController.$inject = ['TableService', '$scope'];

  function PagController(TableService, $scope) {
    this.table = TableService.getCurrentTable();
    this.state = TableService.getTableState();
    this.currentPage = 1;
    this.maxSize = 5;
    this.itemsPerPage = 10;

    this.update = function() {
      var state = {
        startRow: ((this.currentPage - 1) * this.state.nRows),
        nRows: this.state.nRows,
      };
      TableService.updateState(state);
    };

    // watch if nRows, searchTerm or sortField changes.
    $scope.$watch(
      angular.bind(this, function() {
        return this.state.nRows +
               this.state.searchTerm +
               this.state.sortField +
               this.table.id;
      }),
      angular.bind(this, function(newVal, oldVal) {
        this.currentPage = 1;
        this.itemsPerPage = this.state.nRows;
        this.update();
      }),
      true
    );
  }
})();