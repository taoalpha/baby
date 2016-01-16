export function ViewFrameDirective() {
  'ngInject';

  let directive = {
    restrict: 'E',
    scope: {
        src: '='
    },
    replace: true,
    templateUrl: 'template/viewframe.html',
    link: linkFunc,
    controller: ViewFrameController,
    controllerAs: 'vf'
  };

  return directive;

  function linkFunc(scope, el, attr) {
    el.addClass('viewframe');
  }
}

class ViewFrameController {
  constructor ($scope,$log) {
    'ngInject';

    this.$log = $log
    this.status = {
      loadings : {
        // store all loading for different phases or parts
        signing:false, // true after click the sign in button, false when finish the authenticate
        feeds:false,  // true when finish the authenticate(user exist), false when finish formatData
        more:false,  // true after click more button, false when finish the getMore
        action:false,  // true after click add button for any possible actions, false when finish the action
        viewLink: false, // true after click any link in singleMode, false when iframe finishes loading 
      },
      viewUrl : '',
      expandUrl: -1,
      singleMode: typeof $scope.collapse === 'undefined' ? false : $scope.single,
      collapse: typeof $scope.collapse === 'undefined' ? true : $scope.collapse,
      forceDigest: true
    }
    this.$scope = $scope
    // initial data
    // this.$sce = $sce

    this.init()

    this.$scope.$on('outer', ()=>{
      this.$log.info("Outer Render Finished at:"+moment().second())
    })
  }
  init(){
    this.$log.info("asd")
  }
}
