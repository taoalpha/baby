export function RSSDirective() {
  'ngInject';

  let directive = {
    restrict: 'E',
    scope: {
        collapse : '='
    },
    replace: true,
    templateUrl: 'template/rss.html',
    link: linkFunc,
    controller: RSSController,
    controllerAs: 'rm'
  };

  return directive;

  function linkFunc(scope, el) {
    el.addClass('rss');
  }
}

class RSSController {
  constructor ($scope,$log,$http,moment,mySocket) {
    'ngInject';

    this.$log = $log
    this.$http = $http
    this.collapse = false
    this.moment = moment
    this.$scope = $scope
    // initial data
    this.mySocket = mySocket
    var _this = this
    this.$scope.$on('outer', function() {
      _this.$log.info("Outer Render Finished at:"+moment().second())
    })
  }
  toggleCollapse(){
    this.collapse = !this.collapse
  }
  doFeed(){
    if(this.collapse){
      this.toggleCollapse()
      return
    }
  }
}
