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
        linkIsFine: false, // true after click any link in singleMode, false when iframe finishes loading 
        viewFrame : false,
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
      this.authenticate()
    }
    if(this.status.singleMode){
      var viewframe = angular.element(document).find('iframe')
      viewframe.on("onload",function(res){
        console.log(res)
      })
    }
    
    // global listener for connect_error
    this.mySocket.on("connect_error",() => {
      this.$log.info("Disconnected with the server, Your changes won't be saved")
      //this.mySocket.disconnect()
      this.errorMsg = "Connection error"
    })

    // initialize global listener
    this.mySocket.on('rssData', (response) => {
      switch (response.type) {
        case "auth":
          if(response.status){
            if(!this.$cookie.get("user")){
              this.$cookie.put("user",JSON.stringify(this.user))
            }
            this.status.userActive = true
            this.getFeedData()
          }else{
            this.status.loadings.signing = false
            this.$log.info(response.msg)
          }
          break;
        case "more":
          this.$log.info("got more data from socket ..."+this.moment().second());
          for(var feedUrl in response.data){
            if (response.data.hasOwnProperty(feedUrl)) {
              this.feedData[feedUrl] = this.feedData[feedUrl] || {};
              this.feedData[feedUrl].entries = this.feedData[feedUrl].entries || [];
              this.feedData[feedUrl].totalNum = this.feedData[feedUrl].totalNum || [];
              this.feedData[feedUrl].unreadNum = this.feedData[feedUrl].unreadNum || [];
              this.feedData[feedUrl].entries = this.feedData[feedUrl].entries.concat(response.data[feedUrl].entries);
              this.feedData[feedUrl].unreadNum += response.data[feedUrl].unreadNum || 0
              this.feedData[feedUrl].totalNum += response.data[feedUrl].totalNum || 0
            }
          }
          this.status.forceDigest = true
          this.status.loadings.more = false
          this.formatData();
          break;
        case "all":
          this.$log.info("got feed data..."+this.moment().second())
          this.feedData = response.data
          this.formatData()
          break;
        case "error":
          this.$log.info(response.data);
        default:
          this.$log.info("Unrecognized identifier");
      }
    });

    // socket on tool
    this.mySocket.on('toolData', (response) => {
      this.$log.info(response);
      switch (response.type) {
        case "xframe":
          this.status.loadings.linkIsFine = response.linkIsFine;
          // FIXME: Change the name ... basic logic should be : got the result, show the default page with a button or the real good page
          if(!this.status.loadings.linkIsFine){
            this.status.viewUrl = "";
            this.randomPic();
          }
          // hide the loading animation for iframe
          this.status.loadings.viewFrame = false;
          this.$scope.$apply();
          break;
        default :
          this.$log.info("wrong indentifier")
      }
    })
  }
  reload(){
    this.status.forceDigest= true;
    this.status.loadings.reload = true;
    this.getFeedData();
  }
  authenticate(){
    this.status.loadings.signing = true
    this.$log.info("send user information")
    var request = {};
    request.user = this.user;
    request.type = "auth";
    this.mySocket.emit('rss', request);
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
    this.status.vfbg["background-image"] = "url(http://img.wordsmotivate.me/"+pngdate+"/"+pngdatetime+"_1600x1200.jpg)";
  }
  deleteFeed(feedUrl,$event){
    $event.stopPropagation();
    var request = {
      type: "deleteFeed",
      user: this.user,
      feedUrl: feedUrl
    }
    this.mySocket.emit("rss",request);
    // TODO: Set to undefine to boost
    delete this.feedData[feedUrl];
  }
  doFeed(action,data){
    if(this.status.collapse){
      this.status.collapse = !this.status.collapse;
      return
    }
    var request = {}
    if(action == "add"){
      request.user = this.user;
      request.type = "newFeed";
      this.mySocket.emit("rss",request);
    }
    //this.reload();
    this.status.forceDigest = true;
    this.status.loadings.reload = true;
  }
  getMore(feedUrl){
    if(!this.status.loadings.more){
      this.status.loadings.more = true;
      var request = {feedUrl:feedUrl,totalNum:this.feedData[feedUrl].totalNum,skipRead:this.status.skipRead};
      request.type = "more";
      this.mySocket.emit("rss",request);
    }
  }
  expandItem(feedUrl){
    this.status.expandUrl = this.status.expandUrl == feedUrl ? -1 : feedUrl
    this.$window.scrollTo(0,0)
  }
  linkIsFine(link){
    var request = {
      type: "xframe",
      check: "SAMEORIGIN",
      link: link
    }
    this.mySocket.emit("tool",request)
  }
  itemClick(item,feedUrl,$event){
    if(this.status.singleMode){
      this.status.loadings.viewFrame = true;
      $event.preventDefault();
      this.status.viewUrl = this.$sce.trustAsResourceUrl(item.link);
      this.linkIsFine(item.link);  // check the link
      this.status.vfbg['background-image'] = "initial";
    }
    var request = {};
    request.fid = item._id;
    request.user = this.user;
    request.type = "itemClick";
    if(item.read !=1){
      item.read = 1
      this.feedData[feedUrl].unreadNum -= this.feedData[feedUrl].unreadNum == 0 ? 0:1
      this.mySocket.emit("rss",request)
    }
  }
  getFeedData(){
    // read from the disk or from the socket io
    var request = {
      user: this.user,
      type: "all"
    }
    this.mySocket.emit("rss",request)
    this.$log.info("getting feed data..."+this.moment().second())
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
