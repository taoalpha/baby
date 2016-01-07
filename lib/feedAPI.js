"use strict";
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID
var moment = require('moment')

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
    this.stats = {}
  }
  init(){
    var _this = this
    MongoClient.connect('mongodb://127.0.0.1:27017/feedpusher', function(err, db) {
        console.log(db)
        _this.db = db
    })
  }
  insert(collection,data){
    collection.insert(data,(err,docs) =>{
      if(err) throw err;
    })
    this.stats.insertTotal = this.stats.insertTotal || 0 
    this.stats.insertTotal ++
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
  getUserData(user){
    if(user.id){
      user = {_id:ObjectId(user.id)}
    }
    return this.findOne(this.userC,user,{subscribe:1,read:1})
  }
  getSiteBySub(sub){
    return this.find(this.siteC,{feedUrl:{$in:sub}},{feedUrl:1,title:1,link:1}).toArray()
  }
  getDataByFeed(url,allData,read){
    return this.find(this.feedC,{feedUrl:url},{title:1,link:1}).sort({"publishedDate":1}).limit(10).toArray().then( (data) =>{
      data.forEach( (v) => {
        v.read = 0
        if(read.indexOf(v._id.toString())>-1){
          v.read = 1
        }
        allData[url].entries.unshift(v)
      })
    })
  }
  updateUserSub(user,data){
    return this.userC.update(user,{$set:data})
  }
  markRead(user,fid){
    if(user.id){
      user = {_id:ObjectId(user.id)}
    }
    return this.userC.update(user,{$addToSet:{read:fid}})
  }
}

module.exports = FeedSpider
