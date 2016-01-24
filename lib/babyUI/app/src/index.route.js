export function routerConfig ($stateProvider, $urlRouterProvider) {
  'ngInject';
  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: 'template/main.html',
      controller: 'MainController',
      controllerAs: 'main'
    })
    .state('feedpusher', {
      url: '/rss',
      template: '<rss class="single" collapse="false" single="true"></rss>'
    })
    .state('mobile', {
      url: '/mrss',
      template: '<rss class="mobile" collapse="false"></rss>'
    });

  $urlRouterProvider.otherwise('/home');
}
