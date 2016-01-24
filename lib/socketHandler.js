"use strict";
var path = require("path");
var fs = require("fs");
var Helper = require('./helper')

var rssHandler = (socket) =>{
  // DONE: combine them into one listener and emitter
  var FeedSpider = require('./feedAPI'),
      feed = new FeedSpider(),
      allData = {},
      readData = []
  // TODO: set an interval timer check whether there are any updates
  socket.on("rss", (request) =>{
    feed.db.open((err, db) =>{
      switch (request.type) {
        case "auth":
          feed.authenticate(request.user).then( (exist) => {
            var response = {}
            if(exist){
              response.status = 1;
              response.type = "auth";
              response.msg = "Welcome back!";
            }else{
              response.status = 0;
              response.type = "auth";
              response.msg = "User doesn't exist!";
            }
            socket.emit("rssData",response)
          })
          break;
        case "all":
          feed.getUserData(request.user).then( (curUser) => {
            readData = curUser.read;
            feed.getSiteBySub(curUser.subscribe).then( (data) =>{
              // DONE: refactor with promise all and map
              return Promise.all( data.map( (v)=>{
                allData[v.feedUrl] = {}
                allData[v.feedUrl].title = v.title
                allData[v.feedUrl].link = v.link
                allData[v.feedUrl].entries = []
                var query = {
                    feedUrl:v.feedUrl,
                    feedData:allData[v.feedUrl],
                    readData:curUser.read,
                    amount:10,
                    skip:0,
                    skipRead:false
                  }
                return feed.getDataByFeed(query)
              }) )
            }).then( ()=>{
              var response = {};
              response.type = "all";
              response.data = allData;
              socket.emit("rssData",response)
              db.close()
            },(reason)=>{
              var response = {};
              response.type = "error";
              response.data = reason;
              socket.emit("rssData",response)
              db.close()
            })
          })
          break;
        case "more":
          var moreData = {}
          moreData[request.feedUrl] = {}
          moreData[request.feedUrl].entries = []
          var query = {
            feedUrl:request.feedUrl,
            feedData:moreData[request.feedUrl],
            readData:readData,
            amount:request.amount || 10,
            skip:request.totalNum,
            skipRead:request.skipRead
          };
          feed.getDataByFeed(query).then( (data)=>{
            var response = {};
            response.type = "more";
            response.data = moreData;
            socket.emit("rssData",response)
            db.close()
          })
          break;
        case "itemClick":
          feed.markRead(request.user,request.fid).then( ()=>{
            db.close()
          })
          break;
        case "deleteFeed":
          feed.deleteFeed(request.user,request.feedUrl);
          break;
        case "newUser":
          break;
        case "newFeed":
          feed.crawler(request.content,request.user).then( ()=>{
            var moreFeedData = {}
            console.log(feed.stats)
            // and push updated feed data
            feed.getUserData(request.user).then( (curUser) => {
              readData = curUser.read
              feed.getSiteBySub(curUser.subscribe).then( (res) =>{
                return Promise.all( res.map( (v)=>{
                  moreFeedData[v.feedUrl] = {}
                  moreFeedData[v.feedUrl].title = v.title
                  moreFeedData[v.feedUrl].link = v.link
                  moreFeedData[v.feedUrl].entries = []
                  var query = {
                    feedUrl:v.feedUrl,
                    feedData:moreFeedData[v.feedUrl],
                    readData:curUser.read,
                    amount:10,
                    skip:0,
                    skipRead:false
                  }
                  return feed.getDataByFeed(query)
                }) )
              }).then( ()=>{
                var response = {};
                response.type = "all";
                response.data = moreFeedData;
                socket.emit("rssData",response)
                db.close()
              },(reason)=>{
                var response = {};
                response.type = "error";
                response.data = reason;
                socket.emit("rssData",response)
                db.close()
              })
            })
          },(reason)=>{
            var response = {};
            response.type = "error";
            response.data = reason;
            socket.emit("rssData",response)
            db.close()
          })
          break;
        default:
          console.log(request);
      }
    })
  })
}

var widgetHandler = (socket) => {
  socket.on('giveMeSummaryData', (data) => {
    var filepath = path.join(__dirname,'../data/.gSummary.json')
    var summaryData = JSON.parse(fs.readFileSync(filepath))
    socket.emit("summaryData",summaryData)
  });
}


// todo socket handler
var todoHandler = (socket) => {
  socket.on('giveMeTodoData', (data) => {
    var filepath = path.join(__dirname,'../data/.todo.json')
    var todoList = JSON.parse(fs.readFileSync(filepath))
    socket.emit("todoData",todoList)
  });
  socket.on('bye', (data) => {
  });
  socket.on('writeTodo', (data) => {
    var filepath = path.join(__dirname,'../data/.todo.json')
    Helper.writeToFile(filepath,data)
    console.log("Todo data file updated!")
  });
}



// tools socket handler

var toolHandler = (socket) => {
  socket.on('tool', (request) => {
    switch (request.type) {
      case "xframe":
        var req = require('request');
        req(request.link).on("response", (res) => {
          var response = {
            type: "xframe",
            link: request.link,
            linkIsFine: true
          }
          if(res.headers["x-frame-options"] && request.check.indexOf(res.headers["x-frame-options"].toUpperCase())>-1){
            response.linkIsFine = false;
          }
          socket.emit("toolData",response);
        });
      default:
        //
    }
  })
}
module.exports = {

  rss: rssHandler,
  todo: todoHandler,
  widget: widgetHandler,
  tool: toolHandler

}
