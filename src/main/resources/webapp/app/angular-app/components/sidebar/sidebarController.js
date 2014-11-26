(function() {
  'use strict';
  
  angular
    .module('app.sidebar')
    .controller('SidebarController', SidebarController);
  
  SidebarController.$inject = ['TableService', 'SidebarService', '$scope'];

  function SidebarController(TableService, SidebarService, $scope) {
    this.sidebar = SidebarService.getSidebar();
    
    this.selectTable = function(tableId) {
      TableService.setCurrentTable(tableId);
      this.table = TableService.getCurrentTable(tableId);
      this.selected = TableService.getCurrentTable().id;
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
      // $('#side-menu').metisMenu();

      var randomId = SidebarService.getRandomTableId(this.sidebar.schemas);
      this.table = TableService.setCurrentTable(randomId);
    }), true);
  }
})();