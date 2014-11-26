(function() {
  'use strict';

  angular
    .module('app.table')
    .controller('TableController', TableController);
  
  TableController.$inject = ['TableService', '$scope'];

  function TableController(TableService, $scope) {
    this.showOptions = false;

    this.table = TableService.getCurrentTable();
    this.state = TableService.getTableState();

    this.sortASC = true;
    this.dataPrefix = TableService.getDataPrefix();

    this.numberRows = [10, 25, 50, 100];
    this.state.nRows = this.numberRows[0];

    this.updateNRows = function() {
      var state = {
        startRow: 0,
        nRows: this.nRows,
      };
      TableService.updateState(state);
    };

    this.searchTable = function() {
      TableService.search(this.table.id, this.state.searchTerm);
    };

    var currentCol = 'col-1';
    this.sortRows = function(columnN) {

      if (this.sortASC === undefined) {
        this.sortASC = true;
      }
      
      if (currentCol !== this.state.sortField) {
        currentCol = this.state.sortField;
      } else {
        this.sortASC = !this.sortASC;
      }

      var order = this.sortASC ? 'ASC' : 'DESC';
      var state = {
        startRow: 0,
        sortField: this.dataPrefix + columnN,
        sortOrder: order
      };
      TableService.updateState(state);
    };
  }
})();