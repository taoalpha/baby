export function bgImgDirective() {
  'ngInject';

  let directive = {
    restrict: 'A',
    link : function(scope,el,attrs){
      el[0].style.backgroundImage = `url(${attrs.bgSrc})`
    },
    controller: bgImgController,
    controllerAs: 'vm',
    bindToController: true
  };

  return directive;
}

class bgImgController {
  constructor (moment) {
    'ngInject';
    // "this.creation" is available by directive option "bindToController: true"
    this.relativeDate = moment(this.creationDate).fromNow();
  }
}
