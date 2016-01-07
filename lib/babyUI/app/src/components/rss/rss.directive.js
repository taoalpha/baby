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
    controllerAs: 'rss'
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
    this.feedData = {}
    this.firstLoad = true
    this.$scope = $scope
    // initial data
    this.mySocket = mySocket
    this.expandIndex= -1
    var _this = this
    this.getFeedData()
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
  expandItem(index){
    this.expandIndex = this.expandIndex == index ? -1 : index
  }
  feedClick(feedItem){
    var data = {}
    data.fid = feedItem._id
    data.user = {
      useremail: "iamzhoutao92@gmail.com",
      userpass: "zhou1992"
    }
    feedItem.read = 1
    this.mySocket.emit("feedClick",data)
  }
  getFeedData(){
    // read from the disk or from the socket io
    this.mySocket.emit("giveMeFeedData")
    var _this = this
    this.mySocket.on("connect_error",() => {
      _this.$log.info("Disconnected with the server, Your changes won't be saved")
      _this.mySocket.disconnect()
      _this.errorMsg = "Connection error"
    })
    this.$log.info("getting feed data..."+this.moment().second())
    this.mySocket.on('feedData', (data) => {
      _this.$log.info("got feed data..."+this.moment().second())
      _this.gotData = true
      _this.feedData = data
      _this.formatData()
    });
  }
  formatData(){
    if(this.firstLoad){
      this.$scope.$digest();
    }
    this.firstLoad = false
  }
}
