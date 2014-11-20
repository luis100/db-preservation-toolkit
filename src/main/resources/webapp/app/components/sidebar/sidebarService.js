(function() {
  'use strict';
  
  angular
    .module('app.sidebar')
    .service('SidebarService', SidebarService);

  function SidebarService(SolrService, UtilsService, TableService) {
    // TODO change to SolrService
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
      if (UtilsService.objectSize(sidebar) === 0) {
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
          var table = tables[tableName] = {};
          table.id = schemaName + "." + tableName;
          table.triggers = ["trigger1", "trigger2"];
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
      return SolrService.getData(SolrService.FACET, params).then(function(data) {
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
      
      for (var firstSchema in schemas) {
        randFirstSchema = schemas[firstSchema];
        randFirstSchemaName = firstSchema;
        break;
      }

      for (var firstTable in randFirstSchema.tables) {
        var randFirstTableName = firstTable;
        randomTableId = randFirstSchemaName + '.' + randFirstTableName;
        break;
      }
      return randomTableId;
    };
  }
})();