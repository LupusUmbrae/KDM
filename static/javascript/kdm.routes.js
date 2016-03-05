(function () {
  'use strict';

  angular
    .module('scout.routes')
    .config(config);

  config.$inject = ['$routeProvider'];

  /**
   * @name config
   * @desc Define valid application routes
   */
  function config($routeProvider) {
    $routeProvider.when('/', {
      controller: 'IndexController',
      controllerAs: 'vm',
      templateUrl: 'assets/templates/index.html'
    }).when('/nodes/', {
      controller: 'NodesController',
      controllerAs: 'vm',
      templateUrl: 'assets/templates/nodes.html'
    }).when('/nodes/:nodePath*', {
      controller: 'NodesController',
      controllerAs: 'vm',
      templateUrl: 'assets/templates/nodes.html'
    }).otherwise('/');
  }

})();
