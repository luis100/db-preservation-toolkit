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
        Tables.search(this.table.id, this.state.searchTerm);
      };

      var currentCol = "col-1";
      this.sortRows = function(columnN) {

        if (this.sortASC === undefined) {
          this.sortASC = true;
        }
        
        if (currentCol !== this.state.sortField) {
          currentCol = this.state.sortField;
        } else {
          this.sortASC = !this.sortASC;
        }

        var order = this.sortASC ? "ASC" : "DESC";
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

      // watch if nRows, searchTerm or sortField changes.
      $scope.$watch(angular.bind(this, function() {
        return this.state.nRows + this.state.searchTerm + this.state.sortField;
      }), angular.bind(this, function(newVal, oldVal) {
        this.currentPage = 1;
        this.itemsPerPage = this.state.nRows;
        this.update();
      }));
    }
  ]);

  dbpresControllers.controller('SidebarPanelController', ['Tables', 'Sidebar', '$scope',
    function(Tables, Sidebar, $scope) {
      this.sidebar = Sidebar.getSidebar();
      
      this.selectTable = function(tableId) {
        Tables.setCurrentTable(tableId);
        this.table = Tables.getCurrentTable(tableId);
        this.selected = Tables.getCurrentTable().id;
      };

      this.isSelected = function(tableId) {
        return this.selected === tableId;
      };

      // when sidebar structure changes: 
      // - metisMenus is refreshed;
      // - default table is updated;
      $scope.$watch(angular.bind(this, function() {
        return this.sidebar;
      }), angular.bind(this, function(newVal, oldVal) {
        $('#side-menu').metisMenu();
      
        var randomId = Sidebar.getRandomTableId(this.sidebar.schemas);
        this.table = Tables.setCurrentTable(randomId);
      }), true);
    }
  ]);

})();