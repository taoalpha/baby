export function routerConfig ($stateProvider, $urlRouterProvider) {
  'ngInject';
  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'template/main.html',
      controller: 'MainController',
      controllerAs: 'main'
    })
    .state('feedpusher', {
      url: '/rss',
      template: '<rss class="single" collapse="false" single="true"></rss>'
    });

  $urlRouterProvider.otherwise('/');
}
