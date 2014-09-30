(function() {
  'use strict';

  var dbpresControllers = angular.module('dbpresControllers', ['ui.bootstrap']);

  dbpresControllers.controller('TablePanelController', ['Tables',
    function(Tables) {
      this.table = Tables.getCurrentTable();
      // this.state = Tables.getTableState();
      
      this.numberRows = [10, 25, 50, 100];         // move to different controller
      // Tables.setNumberRows(this.numberRows[0]);      // move to different controller

      this.nRows = this.numberRows[0];
      
      this.updateNRows = function(nRows) {
        Tables.setNumberRows(nRows);
      };

      this.searchQuery = "";
      this.searchTable = function() {
        var tableId = this.table.id;
        var searchQuery = this.searchQuery;
        Tables.search(tableId, searchQuery);
      };
    }
  ]);

  // TODO: refactor
  dbpresControllers.controller('PaginationController', ['$scope', 'tableService',
    function($scope, tableService) {
      var metaPrefix = tableService.getMetaPrefix();
      var dataPrefix = tableService.getDataPrefix();
      var metaFields = tableService.getMetaFields();

      $scope.currentPage = 1;
      $scope.maxSize = 5;
      $scope.numPerPage = 10;
      $scope.totalItems = 100000;

      $scope.numPages = function() {
        return Math.ceil($scope.totalItems / $scope.numPerPage);
      };

      $scope.$watch('currentPage + numPerPage', function() {
        var begin = (($scope.currentPage - 1) * $scope.numPerPage);
        var end = begin + $scope.numPerPage;
        console.log("changed to " + begin + "; " + end);
        tableService.getTableRows($scope.tableId, begin, $scope.numPerPage, metaFields.rowN, "ASC", function(rows) {
          console.log(rows);
          $scope.tableRows = rows;
        });
      });
    }
  ]);

  dbpresControllers.controller('SidebarController', [ 'Tables',
    function(Tables) {
      this.schemas = {};
      this.table = Tables.getCurrentTable();
      this.selected = Tables.getCurrentTable().id;

      this.selectTable = function(tableId) {
        Tables.setCurrentTable(tableId);
        this.selected = Tables.getCurrentTable().id;
      };

      this.isSelected = function(tableId) {
        return this.selected === tableId;
      };

      /**************************************************
       * shortcut                                       *
       **************************************************/
      this.expClick = function(tableId) {
        this.selectTable(tableId);
      };
    }
  ]);

})();