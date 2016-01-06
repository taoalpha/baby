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
  exist(collection,query){
    // return promise and access the count from .then(count)
    query = query || {}
    return collection.count(query)
  }
  getDataByFeed(url,allData){
    return this.find(this.feedC,{feedUrl:url},{title:1,link:1}).sort({"publishedDate":-1}).limit(10).toArray().then( (data) =>{
      allData[url].entries = data
    })
  }
}

module.exports = FeedSpider
