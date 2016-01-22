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
    this.moment = moment
    this.status = {
      loadings : {
        // store all loading for different phases or parts
        signing:false, // true after click the sign in button, false when finish the authenticate
        feeds:false,  // true when finish the authenticate(user exist), false when finish formatData
        more:false,  // true after click more button, false when finish the getMore
        action:false,  // true after click add button for any possible actions, false when finish the action
        viewLink: false, // true after click any link in singleMode, false when iframe finishes loading 
        reload: false, // true after click reload, false when load finished
      },
      skipRead: false, // when load more, skip all read
      viewUrl: '',
      vfbg: {}, // the style used for viewframe
      expandUrl: -1,
      singleMode: typeof $scope.collapse === 'undefined' ? false : $scope.single,
      collapse: typeof $scope.collapse === 'undefined' ? true : $scope.collapse,
      forceDigest: true
    }
    this.feedData = {}
    this.$scope = $scope
    // initial data
    this.$sce = $sce
    this.$window = $window
    this.mySocket = mySocket
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
    if(this.status.singleMode){
      var viewframe = angular.element(document).find('iframe')
      viewframe.on("onload",function(res){
        console.log(res)
      })
    }
  }
  reload(){
    this.status.forceDigest= true;
    this.status.loadings.reload = true;
    this.getFeedData();
  }
  authenticate(user){
    this.status.loadings.signing = true
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
        this.status.loadings.signing = false
        this.$log.info(data.msg)
      }
      this.mySocket.removeAllListeners("rss_authenticate_result")
    });
  }
  randomPic(){
    var ranyear,ranmonth,randay,pngdate,pngdatetime;
    ranyear = Math.floor((Math.random()*3)+2010);
    if(ranyear == 2010){
      ranmonth = Math.floor((Math.random()*7)+6);
      randay = Math.floor((Math.random()*11)+20);
      pngdate = ranyear + "." + ranmonth;
      pngdatetime = ranyear + "." + ranmonth+"."+randay;
    }else{
      ranmonth = Math.floor((Math.random()*12)+1);
      randay = Math.floor((Math.random()*12)+1);
      pngdate = ranyear + "." + ranmonth;
      pngdatetime = ranyear + "." + ranmonth+"."+randay;
    }
    this.status.vfbg["background-image"] = "url(http://img.wordsmotivate.me/"+pngdate+"/"+pngdatetime+"_1920x1200.jpg)";
  }
  doFeed(action,data){
    if(this.status.collapse){
      this.status.collapse = !this.status.collapse;
      return
    }
    if(action == "add"){
      data.user = this.user;
      this.mySocket.emit("addFeed",data);
    }
    //this.reload();
    this.status.forceDigest = true;
    this.status.loadings.reload = true;
    this.mySocket.on('feedData', (data) => {
      this.$log.info("got feed data..."+this.moment().second())
      this.feedData = data
      this.formatData()
      this.mySocket.removeAllListeners("feedData")
    });

  }
  getMore(feedUrl){
    if(!this.status.loadings.more){
      this.status.loadings.more = true
      var feedItem = {feedUrl:feedUrl,totalNum:this.feedData[feedUrl].totalNum,skipRead:this.status.skipRead}
      this.mySocket.emit("loadMoreFeed",feedItem)
      this.mySocket.on("moreFeed",(data) => {
        this.$log.info(`Got more feed data!`)
        this.feedData[feedUrl].entries = this.feedData[feedUrl].entries.concat(data[feedUrl].entries)
        this.feedData[feedUrl].unreadNum += data[feedUrl].unreadNum || 0
        this.feedData[feedUrl].totalNum += data[feedUrl].totalNum || 0
        this.status.forceDigest = true
        this.status.loadings.more = false
        this.formatData()
        this.mySocket.removeAllListeners("moreFeed")
      })
    }
  }
  expandItem(feedUrl){
    this.status.expandUrl = this.status.expandUrl == feedUrl ? -1 : feedUrl
    this.$window.scrollTo(0,0)
  }
  linkIsFine(link){
  }
  itemClick(item,feedUrl,$event){
    if(this.status.singleMode){
      $event.preventDefault()
      this.status.viewUrl = this.$sce.trustAsResourceUrl(item.link)
      this.status.vfbg['background-image'] = "initial"
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
    this.status.loadings.signing = false;
    this.status.loadings.reload = false;
    if(this.status.forceDigest){
      this.$scope.$apply();
    }
    this.status.forceDigest= false
  }
}
