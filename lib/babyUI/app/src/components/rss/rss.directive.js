export function RSSDirective() {
  'ngInject';

  let directive = {
    restrict: 'E',
    scope: {
        collapse : '=',
        single : '='
    },
    replace: true,
    templateUrl: 'template/rss.html',
    link: linkFunc,
    controller: RSSController,
    controllerAs: 'rss'
  };

  return directive;

  function linkFunc(scope, el, attr) {
    el.addClass('rss');
  }
}

class RSSController {
  constructor ($scope,$log,$http,moment,mySocket,$sce,$window,$cookies) {
    'ngInject';

    this.$log = $log
    this.$http = $http
    this.collapse = typeof $scope.collapse === 'undefined' ? true : $scope.collapse
    this.moment = moment
    this.loading = false
    this.status = {}
    this.singleMode = typeof $scope.collapse === 'undefined' ? false : $scope.single
    this.feedData = {}
    this.forceDigest = true
    this.$scope = $scope
    // initial data
    this.$sce = $sce
    this.$window = $window
    this.mySocket = mySocket
    this.expandUrl = -1
    this.viewUrl = ''
    this.$cookie = $cookies
    this.user = this.$cookie.getObject("user") || {}

    this.init()

    this.$scope.$on('outer', ()=>{
      this.$log.info("Outer Render Finished at:"+moment().second())
    })
  }
  init(){
    if(this.$cookie.get("user")){
      this.authenticate(this.user)
    }
  }
  authenticate(user){
    this.$log.info("send user information")
    this.mySocket.emit('rss_authenticate', user)
    this.mySocket.on('rss_authenticate_result', (data) => {
      this.$log.info(data)
      if(data.status){
        if(!this.$cookie.get("user")){
          this.$cookie.put("user",JSON.stringify(user))
        }
        this.status.userActive = true
        this.getFeedData()
      }else{
        this.$log.info(data.msg)
      }
      this.mySocket.removeAllListeners("rss_authenticate_result")
    });
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
      data.user = this.user
      this.mySocket.emit("addFeed",data)
    }
    this.forceDigest = true
    this.mySocket.on('feedData', (data) => {
      this.$log.info("got updated feed data..."+this.moment().second())
      this.feedData = data
      this.formatData()
      this.mySocket.removeAllListeners("feedData")
    });
  }
  getMore(feedUrl){
    if(!this.loading){
      this.loading = true
      var feedItem = {feedUrl:feedUrl,curNum:this.feedData[feedUrl].entries.length}
      this.mySocket.emit("loadMoreFeed",feedItem)
      this.mySocket.on("moreFeed",(data) => {
        this.$log.info(`Got more feed data: ${data[feedUrl].entries.length}`)
        this.feedData[feedUrl].entries = this.feedData[feedUrl].entries.concat(data[feedUrl].entries)
        this.feedData[feedUrl].unreadNum += data[feedUrl].unreadNum || 0
        this.forceDigest = true
        this.formatData()
        this.loading = false
        this.mySocket.removeAllListeners("moreFeed")
      })
    }
  }
  expandItem(feedUrl){
    this.expandUrl = this.expandUrl == feedUrl ? -1 : feedUrl
    this.$window.scrollTo(0,0)
  }
  itemClick(item,feedUrl,$event){
    if(this.singleMode){
      $event.preventDefault()
      this.viewUrl = this.$sce.trustAsResourceUrl(item.link)
    }
    var data = {}
    data.fid = item._id
    data.user = this.user
    if(item.read !=1){
      item.read = 1
      this.feedData[feedUrl].unreadNum -= this.feedData[feedUrl].unreadNum == 0 ? 0:1
      this.mySocket.emit("feedClick",data)
    }
  }
  getFeedData(){
    // read from the disk or from the socket io
    this.mySocket.emit("giveMeFeedData",this.user)
    this.mySocket.on("connect_error",() => {
      this.$log.info("Disconnected with the server, Your changes won't be saved")
      this.mySocket.disconnect()
      this.errorMsg = "Connection error"
    })
    this.$log.info("getting feed data..."+this.moment().second())
    this.mySocket.on('feedData', (data) => {
      this.$log.info("got feed data..."+this.moment().second())
      this.feedData = data
      this.formatData()
      this.mySocket.removeAllListeners("feedData")
    });
  }
  formatData(){
    if(this.forceDigest){
      this.$scope.$apply();
    }
    this.forceDigest = false
  }
}
