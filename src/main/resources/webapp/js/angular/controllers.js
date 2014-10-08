(function() {
  'use strict';

  var dbpresControllers = angular.module('dbpresControllers', ['ui.bootstrap']);

  dbpresControllers.controller('TablePanelController', ['Tables',
    function(Tables) {
      // this.loading = false;
      this.table = Tables.getCurrentTable();
      this.state = Tables.getTableState();

      this.sortASC = true;
      this.dataPrefix = Tables.getDataPrefix();

      this.numberRows = [10, 25, 50, 100];
      this.state.nRows = this.numberRows[0];

      this.updateNRows = function() {
        var state = {
          startRow: 0,
          nRows: this.nRows,
        };
        Tables.updateState(state);
      };

      this.searchTable = function() {
        Tables.search(this.table.id, this.searchQuery);
      };

      var currentCol = "col-und1";
      this.sortRows = function(columnN) {
        var order = "DESC";

        this.sortASC = true;
        if (currentCol !== this.state.sortField) {
          currentCol = this.state.sortField;
        } else {
          this.sortASC = !this.sortASC;
        }

        if (this.sortASC) {
          order = "ASC";
        }

        var state = {
          startRow: 0,
          sortField: this.dataPrefix + columnN,
          sortOrder: order
        };
        Tables.updateState(state);
      };
    }
  ]);

  dbpresControllers.controller('PagController', ['$scope', 'Tables',
    function($scope, Tables) {
      this.table = Tables.getCurrentTable();
      this.state = Tables.getTableState();
      this.currentPage = 1;
      this.maxSize = 5;
      this.itemsPerPage = 10;

      this.update = function() {
        var state = {
          startRow: ((this.currentPage - 1) * this.state.nRows),
          nRows: this.state.nRows,
        };
        Tables.updateState(state);
      };

      // watch if nRows changes. i.e: nRows selector changes
      $scope.$watch(angular.bind(this, function() {
        return this.state.nRows + this.state.searchTerm + this.state.sortField;
      }), angular.bind(this, function(newVal, oldVal) {
        this.currentPage = 1;
        this.itemsPerPage = this.state.nRows;
        this.update();
      }));
    }
  ]);

  dbpresControllers.controller('SidebarPanelController', ['$scope', 'Tables', 'Sidebar',
    function($scope, Tables, Sidebar) {
      this.sidebar = Sidebar.getSidebar();
      
      this.selectTable = function(tableId) {
        Tables.setCurrentTable(tableId);
        this.selected = Tables.getCurrentTable().id;
      };

      this.isSelected = function(tableId) {
        return this.selected === tableId;
      };
    }
  ]);

})();