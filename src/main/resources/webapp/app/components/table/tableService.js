(function() {
  'use strict';
  
  angular
    .module('app.table')
    .service('TableService', TableService);

  TableService.$inject = ['SolrService', 'UtilsService'];
  
  function TableService(SolrService, UtilsService) {
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
      return SolrService.getData(SolrService.QUERY, params).then(function(data) {
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
      return SolrService.getData(SolrService.COLUMN_META, params).then(function(data) {
        return sortRowByN(data.response.docs[0], prefix);
      }, function(error) {
        console.error("ERROR getting columns meta");
      });
    };

    // sorts a row by column number
    var sortRowByN = function(objectRow, prefix) {
      var newRow = [];
      // console.log(objectRow);
      for (var i = 1; i <= UtilsService.objectSize(objectRow); i++) {
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
})();