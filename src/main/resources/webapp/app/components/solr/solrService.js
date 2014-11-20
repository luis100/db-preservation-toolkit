(function() {
  'use strict';
  
  angular
    .module('app.solr')
    .service('SolrService', SolrService);

  SolrService.$inject = ['$resource', '$q'];

  function SolrService($resource, $q) {
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
})();