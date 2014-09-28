(function() {
  'use strict';

  var dbpresControllers = angular.module('dbpresControllers', ['ui.bootstrap']);

  dbpresControllers.controller('TableCtrl', ['$scope', '$http', 'solrService', 'tableService',
    function($scope, $http, solrService, tableService) {

      $scope.parseInt = parseInt;

      $scope.tableId = 'id';
      $scope.schemas = {};
      $scope.rowNumbers = [10, 25, 50, 100];

      var metaPrefix = tableService.getMetaPrefix();
      var dataPrefix = tableService.getDataPrefix();
      var metaFields = tableService.getMetaFields();
      
      var handleColumns = function(columns, schemaName, tableName) {
        var tables = $scope.schemas[schemaName].tables;
        tables[tableName].columns = columns;
      };

      var handleColumnsType = function(columnsType, schemaName, tableName) {
        var tables = $scope.schemas[schemaName].tables;
        tables[tableName].columnsType = columnsType;
      };

      var handleTables = function(tables, schemaName) {
        var schemas = $scope.schemas;
        schemas[schemaName].tables = {};
        for (var key in tables) {
          var tableName = tables[key];
          var tableId = schemaName + "." + tableName;
          var table = schemas[schemaName].tables[tableName] = {};
          table.id = tableId;
          // getColumnsMeta(tableId, handleColumns, [schemaName, tableName]);
          // getColumnsTypeMeta(tableId, handleColumnsType, [schemaName, tableName]);
        }
      };

      var getRandomTableId = function(schemas) {
        var randomTableId = '';
        $scope.$watch('schemas', function(newSchemas, oldSchemas) {
          if (newSchemas != oldSchemas) {
            for (var firstSchema in newSchemas) {
              var randFirstSchema = newSchemas[firstSchema];
              var randFirstSchemaName = firstSchema;
              for (var firstTable in randFirstSchema.tables) {
                var randFirstTableName = firstTable;
                randomTableId = randFirstSchemaName + '.' + randFirstTableName;
                break;
              }
              break;
            }
          }
          $scope.tableId = randomTableId;
        }, true);
      };

      tableService.getSchemasMeta(function(schemasNames) {
        for (var key in schemasNames) {
          var schemaName = schemasNames[key];
          $scope.schemas[schemaName] = {};
          tableService.getTablesMeta(schemaName, handleTables, [schemaName]);
        }
        getRandomTableId($scope.schemas);
        $scope.$watch('tableId', function(o, n) {
          if (o != n) {
            $scope.showTable($scope.tableId);
          }
        }, true);
      });

      $scope.showTable = function(tableId) {
        $scope.start = 0;
        $scope.rows = 10;
        $scope.sortASC = true;
        $scope.orderByField = 'col-1';
        $scope.currentCol = 'col-1';
        $scope.tableId = tableId;

        tableService.getColumnsMeta(tableId, function(columns) {
          $scope.tableCols = columns;
        });

        tableService.getColumnsTypeMeta(tableId, function(columnsType) {
          $scope.tableColsType = columnsType;
        });

        tableService.getTableRows(tableId, $scope.start, $scope.rows, metaFields.rowN, "ASC", function(rows) {
          $scope.tableRows = rows;
        });

        tableService.getTableNumberRows(tableId, function(nFound) {
          $scope.numFound = nFound;
        });
      };

      $scope.sortRows = function(tableId, start, offSet, colN) {
        if ($scope.currentCol !== $scope.orderByField) {
          $scope.currentCol = $scope.orderByField;
        } else {
          $scope.sortASC = !$scope.sortASC;
        }

        if ($scope.sortASC) {
          $scope.order = "ASC";
        } else {
          $scope.order = "DESC";
        }

        tableService.getTableRows(tableId, $scope.start, $scope.rows, dataPrefix + colN, $scope.order, function(rows) {
          $scope.tableRows = rows;
        });
      };


      $scope.searchTable = function(tableId) {
        console.log($scope.querySearch);
        var defaultQuery = metaFields.tableId + ':' + tableId;

        if ($scope.querySearch !== "") {
          defaultQuery += ' AND ' + '*' + $scope.querySearch + '*';
        }
        var params = {
          q: defaultQuery,
          fl: dataPrefix + '*',
          sort: metaFields.rowN + " asc"
        };

        tableService.requestSearch(params, function(data) {
          var docs = data.response.docs;
          // console.log(docs);
          $scope.tableRows = docs;
        });
      };

      if (typeof String.prototype.startsWith != 'function') {
        String.prototype.startsWith = function(str) {
          return this.indexOf(str) === 0;
        };
      }

    }
  ]);

  dbpresControllers.controller('PaginationCtrl', ['$scope', 'tableService',
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

  dbpresControllers.controller('SidebarController', ['$scope',
    function($scope) {

    }
  ]);

})();