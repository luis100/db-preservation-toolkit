(function() {
  'use strict';

  angular.module('app.shared', []);
  angular.module('app.solr', ['ngResource']);
  angular.module('app.sidebar', ['ui.bootstrap']);
  angular.module('app.table', []);
  angular.module('app.pagination', []);
  angular.module('app.utils', []);

  angular.module('app',
    [
      'app.shared',
      'app.solr',
      'app.sidebar',
      'app.table',
      'app.pagination',
      'app.utils',
      'ngRoute'
    ]
  );
})();
