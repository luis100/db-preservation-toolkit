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

      this.getMetaPrefix = function() {
        return metaPrefix;
      };

      this.getDataPrefix = function() {
        return dataPrefix;
      };

      this.getMetaFields = function() {
        return metaFields;
      };

      this.getTableState = function() {
        return state;
      };

      this.updateState = function(auxState) {
        if (auxState.startRow !== undefined)   { state.startRow = auxState.startRow; }
        if (auxState.nRows !== undefined)      { state.nRows = auxState.nRows; }
        if (auxState.sortField !== undefined)  { state.sortField = auxState.sortField; }
        if (auxState.sortOrder !== undefined)  { state.sortOrder = auxState.sortOrder; }
        if (auxState.searchTerm !== undefined) { state.searchTerm = auxState.searchTerm; }

        this.search(currentTable.id);
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

        resetState();
        this.search(tableId, "");
      };

      this.search = function(tableId, searchQuery) {
        console.log(searchQuery);
        console.log(tableId);
        console.log("state search term: ", state.searchTerm);
        if (searchQuery !== undefined) {
          state.searchTerm = searchQuery;
        } else {
          searchQuery = state.searchTerm;
        }
        
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
          currentTable.promise = data.promise;
        });
      };

      var resetState = function() {
        state.startRow = 0;
        state.nRows = 10;
        state.sortField = metaFields.rowN;
        state.sortOrder = "ASC";
        state.searchTerm = "";
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
            promise: data.$promise
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
    }
  ]);

  dbpresServices.service('Sidebar', ['Solr', 'Utils', 'Tables',
    function(Solr, Utils, Tables) {

      // TODO change to Solr
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

      var sidebar = {};

      this.getSidebar = function() {
        if (Utils.objectSize(sidebar) === 0) {
          this.initSidebar();
        }
        return sidebar;
      };

      this.initSidebar = function() {
        sidebar.schemas = {};
        getSchemasMeta(function(schemasNames) {
          for (var key in schemasNames) {
            var schemaName = schemasNames[key];
            sidebar.schemas[schemaName] = {};
            getTablesMeta(schemaName, handleTables, [schemaName]);
          }
          var tableId = getRandomTableId(sidebar.schemas);
          console.log("tab,id", tableId);
          Tables.setCurrentTable(tableId);

        });

        sidebar.users = {};
        // getUsersMeta
        sidebar.roles = {};
        // getRolesMeta
        sidebar.privileges = {};
        // getPrivilegesMeta
      };

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
        var tables = sidebar.schemas[schemaName].tables;
        tables[tableName].columns = columns;
      };

      var handleColumnsType = function(columnsType, schemaName, tableName) {
        var tables = sidebar.schemas[schemaName].tables;
        tables[tableName].columnsType = columnsType;
      };

      var handleTables = function(tables, schemaName) {
        var schemas = sidebar.schemas;
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

      // TODO: 
      var getRandomTableId = function(schemas) {
        var randomTableId = 'und';
        var randFirstSchema = {};
        var randFirstSchemaName = '';
        console.log("schemas: ", schemas);
        // $scope.$watch('schemas', function(newSchemas, oldSchemas) {
          // if (newSchemas != oldSchemas) {
            for (var firstSchema in schemas) {
              console.log("first: ", firstSchema);
              randFirstSchema = schemas[firstSchema];

              console.log("sss", randFirstSchema);
              randFirstSchemaName = firstSchema;
              break;
            }


            console.log("!!!!", schemas[randFirstSchemaName]);
            //   console.log("randFirst", firstSchema);
              for (var firstTable in randFirstSchema.tables) {
                var randFirstTableName = firstTable;
                console.log("hre:", randFirstTableName);
                randomTableId = randFirstSchemaName + '.' + randFirstTableName;
                console.log("randomID", randomTableId);
                break;
              }
            //   break;
            // }
          // }
        // }, true);
        return randomTableId;
      };

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