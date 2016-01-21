"use strict";
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID
var moment = require('moment')
var gfeed = require("google-feed")

class FeedSpider{
  constructor(){
    // configuration
    this.CONFIG = {}
    // the db instance
    this.db = new mongo.Db('feedpusher', new mongo.Server('192.168.0.107', 27017))
    this.siteC = this.db.collection("site")
    this.feedC = this.db.collection("feed")
    this.userC = this.db.collection("user")
    // statistical data
    this.stats = {entries:{}}
  }
  init(){
  }
  insert(collection,data){
    this.stats.insertTotal = this.stats.insertTotal || 0 
    this.stats.insertTotal ++
    return collection.insert(data)
  }
  find(collection,query,match){
    // return promise and access the docs from .then(docs)
    query = query || {}
    match = match || {}
    return collection.find(query,match)
  }
  findOne(collection,query,match){
    // return promise and access the docs from .then(docs)
    query = query || {}
    match = match || {}
    return collection.findOne(query,match)
  }
  exist(collection,query){
    // return promise and access the count from .then(count)
    query = query || {}
    return collection.count(query)
  }
  addNewSite(url){
    return this.crawler(url)
  }
  updateDuration(feedUrls){
    return Promise.all(feedUrls.map( (feedUrl) => {
      return this.siteC.findOne({feedUrl:feedUrl}).then( (doc) =>{
        var duration = doc.lastUpdateDuration
        if(this.stats.entries[feedUrl]===0){
          // increase the duration if no updates
          duration *= 1.5
        }else{
          // decrease the duration if there are updates during the last crawl
          duration *= 0.5
        }
        // set the upper and lower limit for duration, and also only keep 3 numbers after the period
        duration > 100 ? duration=100 : duration=Number(duration).toFixed(3)
        duration < 0.1 ? duration=0.1 : duration=Number(duration).toFixed(3)
        this.siteC.update({feedUrl: feedUrl},{$set:{lastUpdateDuration:Number(duration)}})
      })
    }) )
  }
  updateCrawled(feedUrls){
    return Promise.all(feedUrls.map( (feedUrl) => {
      return this.siteC.findOne({feedUrl:feedUrl}).then( (doc) =>{
        var curTime = moment().format()
        this.siteC.update({feedUrl: feedUrl},{$set:{lastCrawled:curTime}})
      })
    }) )
  }
  crawler(url,user){
    var _this = this
    var data = {}
    var allTempPromises = []
    return gfeed.load(url)
    .then((tdata)=>{
      _this.stats.entries[url] = 0
      data = tdata
      if(user){
        // update user subscribe list
        _this.updateUser(user,{$addToSet:{subscribe:tdata.feed.feedUrl}})
      }
      return _this.siteC.count({'feedUrl':tdata.feed.feedUrl})
    })
    .then( (count) => {
      if(count == 0){
        var siteInfo = {
          title: data.feed.title,
          link: data.feed.link,
          feedUrl: data.feed.feedUrl,
          author: data.feed.author,
          description: data.feed.description,
          type: data.feed.type,
          addedDate: moment().format(),
          lastUpdated: moment().format(),
          // last crawled time with valid new feeds
          lastUpdateDuration: 0.5,
          // duration unit: hour
          // default is 0.5 => initial as crawling every half hour
          lastCrawled: moment().format()
        }
        return _this.insert(_this.siteC,siteInfo)
      }else{
        // already stored
        // console.log("already stored")
        return Promise.all([])
      }
    })
    .then( ()=>{
      // insert new feed into the db if doesn't already have
      // console.log("Start crawling the feeds")
      return Promise.all(data.feed.entries.map( (v) => {
        var feedInfo = {
          title: v.title,
          link: v.link,
          publishedDate: moment(new Date(v.publishedDate)).isValid() ? moment(new Date(v.publishedDate)).format() : moment().format(),
          author: v.author,
          feedUrl:data.feed.feedUrl,
          content: v.content,
          categories: v.categories,
          addedDate: moment().format()
        }
        return _this.exist(_this.feedC,{'link':v.link}).then( (count) => {
          if(count == 0){
            _this.stats.entries[url] += 1
            _this.insert(_this.feedC,feedInfo)
          }
        })
      }) )
    })
  }
  authenticate(user){
    // return promise with count, you can judge from the count <> 1
    return this.exist(this.userC,user).then( (count) => {return count==1})
  }
  addNewUser(user){
    this.insert(this.userC,user)
  }
  getUserData(user){
    // get user data: subscribe,read,star,collection,status...
    if(user.id){
      user = {_id:ObjectId(user.id)}
    }
    return this.findOne(this.userC,user)
  }
  getSiteBySub(sub){
    return this.find(this.siteC,{feedUrl:{$in:sub}},{feedUrl:1,title:1,link:1}).toArray()
  }
  getDataByFeed(query){
    query.amount = query.amount || 20
    query.skip = query.skip || 0
    return this.find(this.feedC,{feedUrl:query.feedUrl},{title:1,link:1}).sort({"publishedDate":-1}).skip(query.skip).limit(query.amount).toArray().then( (data) =>{
      data.forEach( (v) => {
        v.read = 0
        query.allData[url].unreadNum = query.allData[url].unreadNum || 0
        query.allData[url].unreadNum ++
        // TODO: Speed up this process
        if(query.read.indexOf(v._id.toString())>-1){
          v.read = 1
          query.allData[url].unreadNum --
        }
        if(query.skipRead){
          if(v.read == 0){
            query.allData[url].entries.push(v)
          }
        }else{
          query.allData[url].entries.push(v)
        }
      })
    })
  }
  updateUser(user,data){
    // updateUser
    return this.userC.update(user,data)
  }
  markRead(user,fid){
    if(user.id){
      user = {_id:ObjectId(user.id)}
    }
    return this.userC.update(user,{$addToSet:{read:fid}})
  }
}

module.exports = FeedSpider
