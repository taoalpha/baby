export function globalInitial ($state, $stateParams,$window) {
  if($window.innerWidth < 760){
    if($state.current.name != "mobile"){
      $state.go("mobile");
    }
  }
}
