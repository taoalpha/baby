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
    this.forceDigest = true
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
  doFeed(action,data){
    if(this.collapse){
      this.toggleCollapse()
      return
    }
    if(action == "add"){
      this.mySocket.emit("addFeed",data)
    }
    this.getFeedData()
  }
  getMore(feedUrl){
    var _this = this
    var feedItem = {feedUrl:feedUrl,curNum:this.feedData[feedUrl].entries.length}
    this.mySocket.emit("loadMoreFeed",feedItem)
    this.mySocket.on("moreFeed",(data) => {
      _this.$log.info(`Got more feed data: ${data[feedUrl].entries.length}`)
      _this.feedData[feedUrl].entries = _this.feedData[feedUrl].entries.concat(data[feedUrl].entries)
      _this.feedData[feedUrl].unreadNum += data[feedUrl].unreadNum || 0
      _this.forceDigest = true
      _this.formatData()
      _this.mySocket.removeAllListeners("moreFeed")
    })
  }
  expandItem(index){
    this.expandIndex = this.expandIndex == index ? -1 : index
  }
  itemClick(item,feedUrl){
    this.$log.info(feedUrl)
    var data = {}
    data.fid = item._id
    data.user = {
      useremail: "iamzhoutao92@gmail.com",
      userpass: "zhou1992"
    }
    item.read = 1
    this.feedData[feedUrl].unreadNum -= this.feedData[feedUrl].unreadNum == 0 ? 0:1
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
      _this.mySocket.removeAllListeners("feedData")
    });
  }
  formatData(){
    if(this.forceDigest){
      this.$scope.$apply();
    }
    this.forceDigest = false
  }
}
