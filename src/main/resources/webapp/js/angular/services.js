(function() {
  'use strict';

  /*************************************************************
   * Solr service                                              *
   *************************************************************/
  var dbpresServices = angular.module('dbpresServices', ['ngResource']);

  // TODO: add config
  dbpresServices.service('Solr', ['$resource',
    function($resource) {
      var port = '8983';
      var dbName = 'collection1';
      var url = 'http://localhost:' + port + '/solr/' + dbName + '/select';

      return $resource(url, {
        wt: 'json',
        'json.wrf': 'JSON_CALLBACK',
      }, {
        query: {
          method: 'JSONP',
        },
        facet: {
          method: 'JSONP',
          params: {
            q: "*:*",
            facet: true,
            start: 0,
            rows: 0
          }
        },
        columnMeta: {
          method: 'JSONP',
          params: {
            start: 0,
            rows: 1
          }
        }
      });
    }
  ]);

  /*************************************************************
   * Tables service                                            *
   *************************************************************/
  dbpresServices.service('Tables', ['Solr', 'Utils',
    function(Solr, Utils) {

      // change to be configurable
      var metaPrefix = 'dbpres_meta_';
      var dataPrefix = 'dbpres_data_';
      var metaFields = {
        id: metaPrefix + 'id',
        tableId: metaPrefix + 'tableId',
        table: metaPrefix + 'table',
        schema: metaPrefix + 'schema',
        rowN: metaPrefix + 'rowN',
        columns: metaPrefix + 'col_',
        columnsType: metaPrefix + 'colType_'
        // complete..
      };

      var currentTable = {
        id: 'default-id',
        numFound: 0,
        columns: [],
        columnsType: [],
        rows: []
      };

      var state = {
        startRow: 0,
        nRows: 10,
        sortField: metaFields.rowN,
        sortOrder: "ASC",
        searchTerm: ""
      };

      this.getTableState = function() {
        return state;
      };

      this.setNumberRows = function(nRows) {
        state.nRows = nRows;
        this.search(currentTable.id, state.searchTerm);
      };

      this.getCurrentTable = function() {
        return currentTable;
      };

      this.setCurrentTable = function(tableId) {
        currentTable.id = tableId;
        
        getColumnsMeta(tableId, function(columns) {
          currentTable.columns = columns;
        });

        getColumnsTypeMeta(tableId, function(columnsType) {
          currentTable.columnsType = columnsType;
        });

        this.search(tableId, "");
      };


      // update usa getTableRows que dá linhas 2º um critério (útil quando o update é usado no setCurrentTable)
      // mas quando se faz uma pesquisa/filtro o update vai user getTableRows não preservando as linhas de uma dada pesquisa
      this.update = function() {
        var table = currentTable;
        var tableId = table.id;
      };

      var resetStatus = function() {
        status.startRow = 0;
        status.nRows = 10;
        status.sortField = metaFields.rowN;
        status.sortOrder = "ASC";
      };


      this.search = function(tableId, searchQuery) {
        state.searchTerm = searchQuery;
        console.log(searchQuery);
        console.log(tableId);
        var query = metaFields.tableId + ':' + tableId;

        if (searchQuery !== "") {
          query += ' AND ' + '*' + searchQuery + '*';
        }

        var params = {
          q: query,
          fl: dataPrefix + '*',
          start: state.startRow,
          rows: state.nRows,
          sort: state.sortField + ' ' + state.sortOrder
        };

        getTableRows(params, function(data) {
          currentTable.rows = data.rows;
          currentTable.numFound = data.numFound;
        });
      };

      var getTableRows = function(params, callback) {
        Solr.query(params, function(data) {
          var rows = data.response.docs.map(function(row) {
            return sortRowByN(row, dataPrefix);
          });
          console.log(rows);
          var result = {
            rows: rows,
            numFound: data.response.numFound,
          };
          callback(result);
        });
      };

      var requestColumnMeta = function(params, prefix, callback, args) {
        Solr.columnMeta(params, function(data) {
          var newArgs = [];
          var orderedColMeta = sortRowByN(data.response.docs[0], prefix);
          newArgs.push(orderedColMeta);
          if (args) {
            for (var key in args) {
              newArgs.push(args[key]);
            }
          }
          callback.apply(this, newArgs);
        });
      };

      // sorts a row by column number
      var sortRowByN = function(objectRow, prefix) {
        var newRow = [];
        // console.log(objectRow);
        for (var i = 1; i <= Utils.objectSize(objectRow); i++) {
          newRow[i - 1] = objectRow[prefix + i];
        }
        return newRow;
      };

      var getColumnsMeta = function(columnsTableId, callback, args) {
        var params = {
          fl: metaFields.columns + '*',
          q: metaFields.tableId + ':' + columnsTableId
        };
        requestColumnMeta(params, metaFields.columns, callback, args);
      };

      var getColumnsTypeMeta = function(columnsTableId, callback, args) {
        var params = {
          fl: metaFields.columnsType + '*',
          q: metaFields.tableId + ':' + columnsTableId
        };
        requestColumnMeta(params, metaFields.columnsType, callback, args);
      };

      // var getTableRows2 = function(tableId, from, to, sortField, sortOrder, callback) {
      //   var params = {
      //     q: metaFields.tableId + ':' + tableId,
      //     fl: dataPrefix + '*',
      //     start: from,
      //     rows: to,
      //     sort: sortField + ' ' + sortOrder
      //   };

      //   getTableRows(params, callback);
      // };

      // var getTableNumberRows = function(tableId, callback) {
      //   var params = {
      //     q: metaFields.tableId + ':' + tableId,
      //   };
      //   Solr.query(params, function(data) {
      //     console.log(data);
      //     callback(data.response.numFound);
      //   });
      // };

      // $scope.sortRows = function(tableId, start, offSet, colN) {
      //   if ($scope.currentCol !== $scope.orderByField) {
      //     $scope.currentCol = $scope.orderByField;
      //   } else {
      //     $scope.sortASC = !$scope.sortASC;
      //   }

      //   if ($scope.sortASC) {
      //     $scope.order = "ASC";
      //   } else {
      //     $scope.order = "DESC";
      //   }

      //   tableService.getTableRows(tableId, $scope.start, $scope.rows, dataPrefix + colN, $scope.order, function(rows) {
      //     $scope.tableRows = rows;
      //   });
      // };

    }
  ]);

  dbpresServices.service('SchemaMeta', ['Solr',
    function(Solr) {

      // getSchemasMeta(function(schemasNames) {
      //   for (var key in schemasNames) {
      //     var schemaName = schemasNames[key];
      //     $scope.schemas[schemaName] = {};
      //     tableService.getTablesMeta(schemaName, handleTables, [schemaName]);
      //   }
      //   getRandomTableId($scope.schemas);
      //   $scope.$watch('tableId', function(o, n) {
      //     if (o != n) {
      //       $scope.showTable($scope.tableId);
      //     }
      //   }, true);
      // });

      var getSchemasMeta = function(callback) {
        var params = {
          'facet.field': metaFields.schema
        };
        requestFacet(params, callback);
      };

      var getTablesMeta = function(tableSchema, callback, args) {
        tableSchema = (typeof tableSchema !== 'undefined') ? tableSchema : '*';
        var params = {
          'facet.field': metaFields.table,
          q: metaFields.schema + ':' + tableSchema
        };
        requestFacet(params, callback, args);
      };

      var requestFacet = function(params, callback, args) {
        Solr.facet(params, function(data) {
          var processedFacets = processFacetFields(data, params['facet.field']);
          var newArgs = [];

          newArgs.push(processedFacets);
          if (args) {
            for (var key in args) {
              newArgs.push(args[key]);
            }
          }
          callback.apply(this, newArgs);
        });
      };

      var processFacetFields = function(data, metaField) {
        var facetFields = data.facet_counts.facet_fields[metaField];
        var size = facetFields.length;
        var processedResponse = [];
        for (var i = 0; i < size; i++) {
          if (i % 2 === 0) {
            if (facetFields[i + 1] > 0) {
              processedResponse.push(facetFields[i]);
            }
          }
        }
        return processedResponse;
      };

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

      // var getRandomTableId = function(schemas) {
      //   var randomTableId = '';
      //   $scope.$watch('schemas', function(newSchemas, oldSchemas) {
      //     if (newSchemas != oldSchemas) {
      //       for (var firstSchema in newSchemas) {
      //         var randFirstSchema = newSchemas[firstSchema];
      //         var randFirstSchemaName = firstSchema;
      //         for (var firstTable in randFirstSchema.tables) {
      //           var randFirstTableName = firstTable;
      //           randomTableId = randFirstSchemaName + '.' + randFirstTableName;
      //           break;
      //         }
      //         break;
      //       }
      //     }
      //     $scope.tableId = randomTableId;
      //   }, true);
      // };
    }
  ]);


  /*************************************************************
   * Utils service                                             * 
   *************************************************************/
  dbpresServices.service('Utils', [
    function() {

      this.myStartsWith = function(str) {
          return this.indexOf(str) === 0;
      };
    
      this.objectSize = function(obj) {
        var size = 0,
          key;
        for (key in obj) {
          if (obj.hasOwnProperty(key)) size++;
        }
        return size;
      };

    }
  ]);


})();