(function() {
  'use strict';

  /*************************************************************
   * Solr service                                              *
   *************************************************************/
  var dbpresServices = angular.module('dbpresServices', ['ngResource']);

  // TODO: add config
  dbpresServices.service('Solr', ['$resource', '$q',
    function($resource, $q) {
      var URL_SOLR = "http://localhost:8983/solr/collection1";
      this.QUERY = "query";
      this.FACET = "facet";
      this.COLUMN_META = "columnMeta";

      this.getData = function(action, params) {
        var resource = $resource(URL_SOLR + '/select', { wt: 'json', 'json.wrf': 'JSON_CALLBACK'}, {
          query: { method: 'JSONP' },
          facet: { method: 'JSONP', params: { q: "*:*", facet: true, start: 0, rows: 0 }},
          columnMeta: { method: 'JSONP', params: { start: 0, rows: 1 }}
        });

        var deferred = $q.defer();
        resource[action](params, function(data) {
          deferred.resolve(data);
        }, function(error) {
          deferred.reject(error);
        });

        return deferred.promise;
      };
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
        sortField: dataPrefix + "1",
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
        
        getColumnsMeta(tableId).then(function(columns) {
          currentTable.columns = columns;
        });

        getColumnsTypeMeta(tableId).then(function(columnsType) {
          currentTable.columnsType = columnsType;
        });

        resetState();
        this.search(tableId);
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

        console.log("search init", state.sortField);
        var params = {
          q: query,
          fl: dataPrefix + '*',
          start: state.startRow,
          rows: state.nRows,
          sort: state.sortField + ' ' + state.sortOrder
        };

        getTableRows(params).then(function(data) {
          currentTable.rows = data.rows;
          currentTable.numFound = data.numFound;
        }, function(error) {
          console.error("ERROR getting table rows");
        });
      };

      var resetState = function() {
        state.startRow = 0;
        state.nRows = 10;
        state.sortField = dataPrefix + "1";
        state.sortOrder = "ASC";
        state.searchTerm = "";
      };

      var getTableRows = function(params, callback) {
        return Solr.getData(Solr.QUERY, params).then(function(data) {
          var rows = data.response.docs.map(function(row) {
            return sortRowByN(row, dataPrefix);
          });

          return {
            rows: rows,
            numFound: data.response.numFound
          };
        }, function(error){
          console.error("ERROR getting table rows");
        });
      };

      var requestColumnMeta = function(params, prefix) {
        return Solr.getData(Solr.COLUMN_META, params).then(function(data) {
          return sortRowByN(data.response.docs[0], prefix);
        }, function(error) {
          console.error("ERROR getting columns meta");
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
        return requestColumnMeta(params, metaFields.columns);
      };

      var getColumnsTypeMeta = function(columnsTableId, callback, args) {
        var params = {
          fl: metaFields.columnsType + '*',
          q: metaFields.tableId + ':' + columnsTableId
        };
        return requestColumnMeta(params, metaFields.columnsType);
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
        sidebar.schemas = createSchemasStruct();
        sidebar.users = {};
        sidebar.roles = {};
        sidebar.privileges = {};
      };

      var createSchemasStruct = function() {
        var schemas = {};
        getSchemasMeta().then(function(schemasNames) {
          for (var key in schemasNames) {
            var schemaName = schemasNames[key];
            schemas[schemaName] = createSchemaStruct(schemaName);
          }
        });
        return schemas;
      };

      var createSchemaStruct = function(schemaName) {
        var schema = {};
        schema.tables = createTablesStruct(schemaName);
        schema.views = createViewsStruct(schemaName);
        return schema;
      };

      var createTablesStruct = function(schemaName) {
        var tables = {};
        getTablesMeta().then(function(tablesNames) {
          for (var key in tablesNames) {
            var tableName = tablesNames[key];
            tables[tableName] = { id: schemaName + "." + tableName };
          }
        },
        function(error) {
          console.error("Error getting tables names");
        });
        return tables;
      };

      var createViewsStruct = function(schemaName) {
        return {
          view1: {},
          view2: {}
        };
      };

      var getSchemasMeta = function() {
        var params = {
          'facet.field': metaFields.schema
        };
        return requestFacet(params);
      };

      var getTablesMeta = function(tableSchema, callback, args) {
        tableSchema = (typeof tableSchema !== 'undefined') ? tableSchema : '*';
        var params = {
          'facet.field': metaFields.table,
          q: metaFields.schema + ':' + tableSchema
        };
        return requestFacet(params);
      };

      var requestFacet = function(params, callback, args) {
        return Solr.getData(Solr.FACET, params).then(function(data) {
          return processFacetFields(data, params['facet.field']);
        }, function (error) {
          console.error("ERROR: couldn't get facet fields");
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

      this.getRandomTableId = function(schemas) {
        var randomTableId = 'und';
        var randFirstSchema = {};
        var randFirstSchemaName = '';
        console.log("schemas: ", schemas);
        
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