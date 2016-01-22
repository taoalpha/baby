#! /usr/bin/env node
"use strict";
// modules from third party
var parseArgs = require('minimist')
var readline = require('readline')
var path = require("path")
var url = require("url")
var fs = require("fs")
var Trie = require("./lib/trie")
var http = require('http')
var omelette = require("omelette");
var Helper = require('./lib/helper')
var moment = require('moment');


class Baby{
  constructor(){
    this.userArgs = parseArgs(process.argv.slice(2))
    // assign tasks with shortnames 
    this.shortName = {
      b:"blog",
      e:"edit",
      h:"help",
      i:"idea",
      kuawo:"praise",
      p:"praise",
      r:"read",
      s:"sleep",
      ss:"ssh",
      t:"todo"
    }
  }
  init(){
    // load config file first if exists
    // should be some useful and basic information
    // like Enable the summary report
    // or Customize the path of the data file
    var configFile = path.join(__dirname,'./data/.config.json')
    this.userArgs.CONFIG = {}
    if(Helper.fileExists(configFile)){
      this.userArgs.CONFIG = require(configFile)
    }else{
      this.userArgs.CONFIG = {}
      this.userArgs.CONFIG.username = "Tao"
      this.userArgs.CONFIG.summary = true
      this.userArgs.CONFIG.todoFilePath = ''
      this.userArgs.CONFIG.autoComplete = false
      console.log("Initialize with default configuration.")
      Helper.writeToFile(configFile,this.userArgs.CONFIG)
      // by default, disable the autocomplete
      if(this.userArgs.CONFIG.autoComplete){
        //complete.init()
      }
    }
    // main, assign the task to proper handler
    var task = this.userArgs._[0]
    if(task){
      if(this[task]){
        this[task]()
      }else if(this.shortName.hasOwnProperty(task)){
        this[this.shortName[task]]()
      }else if(Helper.fileExists(task)){
        this.userArgs._[1] = task
        this.edit()
      }else{
        var filepath = path.join(process.cwd(),this.userArgs._.join("/"))
        if(Helper.fileExists(filepath)){
          this.userArgs._[1] = filepath
          this.edit()
        }else if(Helper.fileExists(filepath,'dir')){
          this.userArgs._[1] = filepath
          this.userArgs.isDir = true
          this.edit()
        }else{
          this["help"]()
        }
      }
    }else{
      this["help"]()
    }
  }
  // blog
  blog(){
    var args = this.userArgs
    // blog new draft "name of the post" -c blog
    var scaffolds = process.env.HOME+"/github/blog/scaffolds/"
    var posts = process.env.HOME+"/github/blog/source/_posts/"
    if(Helper.exists(args._[1])){
      switch (args._[1]){
        case "new":
          var tmplName = args._[3] ? args._[2]+".md" : "post.md"
          var title = args._[3] || args._[2]
          if(!Helper.fileExists(scaffolds+tmplName)){
            this.help("blog")
          }else{
            var tmpl = fs.readFileSync(scaffolds+tmplName,"utf-8")
            var filepath = posts+moment().format().split("T")[0]+"-"+title.replace(/\s-/g,'').replace(/ /g,'-')+".md"
            var category = 'blog'
            if(Helper.exists(args.c)){
              category = args.c
              filepath = posts+args.c+"/"+title.toLowerCase().replace(/\s-/g,'').replace(/ /g,'-')+".md"
            }
            tmpl = tmpl.replace("{{ date }}",moment().format().split(".")[0].replace("T"," "))
                       .replace("{{ cat }}",category)
                       .replace('{{ title }}',title)
            Helper.writeToFile(filepath,tmpl,"text")
            console.log(`${Helper.Colors.FgGreen}Your post has created ans saved in: ${Helper.Colors.FgRed}${filepath} ${Helper.Colors.Reset}`)
            args._[1] = filepath
            this.edit()
          }
          break
        case "dir":
          var dir = "~/github/blog"
          var proc = require('child_process').spawn('pbcopy')
          proc.stdin.write(dir)
          proc.stdin.end()
          break
        default:
          this.help("blog")
      }
    }else{
      this.help("blog")
    }
  }
  // search cdnjs
  cdn(){
    var args = this.userArgs
    if(args._[1]){
      var cdnjs = require("./data/cdnjs.json") 
      var trieData = require("./data/trie.json") 
      var count = 0
      var tree = new Trie()
      tree.root = trieData.root
      // build the trie tree at the first time
      //for(var item in cdnjs){
      //  tree.insert(item)
      //}
      //fs.writeFileSync("./data/trie.json",JSON.stringify(tree))
      var results = tree.autocomplete(args._[1])
      if(!results){console.log("No Matches Found!");return}
      results.slice(0,10).map((v) => {
        var fixLenghtItem = Helper.toLength(v,30)
        console.log(`${fixLenghtItem}${cdnjs[v]}`)
      })

    }else{
      this.help("cdn")
    }
  }
  // edit some file or this script
  edit(){
    var args = this.userArgs
    var initial_lines = 0, end_lines = 0,filepath = ''
    if(args._[1]){
      filepath = path.join.apply(path,Helper.pathParser([process.cwd(),args._[1]]))
    }else{
      filepath = __dirname+'/index.js'
    }
    // get the initial number of lines
    args.isDir || Helper.exec("wc -l "+filepath,(out) => {initial_lines = out.split("/")[0]})
    var vim = Helper.spawn('vim',[filepath])
    vim.on('close',(code) => {
      args.isDir || Helper.exec("wc -l "+filepath,
        (out) => {
          end_lines = out.split("/")[0] 
          var color = Helper.Colors.FgGreen + "+ "
          args._[1] = 'coding'
          var data = {}
          data.addCount = end_lines - initial_lines
          data.delCount = 0
          if(end_lines - initial_lines == 0){
            color = Helper.Colors.FgYellow
          }
          if(end_lines - initial_lines < 0){
            data.delCount = initial_lines - end_lines
            data.addCount = 0
            color = Helper.Colors.FgRed
          }
          if(end_lines - initial_lines !== 0){
            this.summary(data)
          }
          console.log(`You have made ${color}${ end_lines - initial_lines }${Helper.Colors.Reset} changes !`)
          Helper.sayGoodBye(args) 
        });
    })
  }
  // support git short name
  git(){
    var args = this.userArgs
    if(Helper.exists(args._[1])){
      var msg = args._[2] || "daily update"
      switch (args._[1]) {
        case "normal":
          Helper.execSync("git add .")
          Helper.execSync(`git commit -m'${msg}'`)
          Helper.execSync(`git push`)
          break
        default:
          console.log("missing parameter")
      }
    }else{
      console.log("Please specify your action!")
    }
  }
  // idea collection
  idea(){
    var args = this.userArgs
    var filepath = path.join(__dirname,'./data/.idea.json')
    var filestatus = Helper.fileExists(filepath)
    var showIdea = true
    // deal with no file and open the server
    if(!filestatus){
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question("Will initialize the idea collection profile (Y/n) ? ", (answer) => {
        if(answer.toLowerCase() == "y"){
          var data = {}
          data.total = 0
          data.creationTime = new Date()
          data.lastUpdated = new Date()
          data.ideas = []
          Helper.writeToFile(filepath,data)
          Helper.sayGoodBye(args)
        }
        rl.close();
      });
    }else{
      // add new idea
      var ideaData = require(filepath)
      if(Helper.exists(args.a)){
        showIdea = false
        var questions = ["Describe your idea: ","Inspired by: ","Under which category(life,work,travel...): ","Tag you to label it: "] 
        // loop to ask all these questions and save all answers 
        var callback = (ans) => {
          // store the data to the file
          var data = {}
          data.desc = ans[0]
          data.inspired = ans[1]
          data.cat = ans[2]
          data.tags = ans[3].split(",")
          data.status = "backlog"
          ideaData.ideas.push(data)
          Helper.writeToFile(filepath,ideaData)
          showIdea = true
        }
        Helper.ask(questions,[],callback)
      }
      // mark the idea with done status
      if(Helper.exists(args.d)){
        if(args.d !== true && parseInt(args.d) == parseInt(args.d)){
          ideaData.ideas[args.d].status = "done"
          Helper.writeToFile(filepath,ideaData)
        }else{
          this.help("idea")
        }
      }
      // edit current existing idea with all five questions
      if(Helper.exists(args.e)){
        if(args.e !== true && parseInt(args.e) == parseInt(args.e)){
          // initial the question with the answers
          var tData = ideaData.ideas[args.e]
          var questions = [`Describe your idea(${tData.desc}): `,`Inspired by(${tData.inspired}): `,`Under which category(${tData.cat}): `,`Tag you to label it(${tData.tags.join(",")}): `,`Current status of this idea(${tData.status}): `] 
          // loop to ask all these questions and save all answers 
          var callback = (ans) => {
            // store the data to the file
            var data = ideaData.ideas[args.e]
            data.desc = ans[0] || data.desc
            data.inspired = ans[1] || data.inspired
            data.cat = ans[2] || data.cat
            data.tags = ans[3] || ans[3].split(",") || data.tags
            data.status = ans[4] || data.status
            ideaData.ideas[args.e] = data
            Helper.writeToFile(filepath,ideaData)
            delete args.e
            this.idea()
          }
          Helper.ask(questions,[],callback)
          return
        }else{
          this.help("idea")
        }
      }
      // remove current existing idea 
      if(Helper.exists(args.r)){
        if(args.r !== true && parseInt(args.r) == parseInt(args.r)){
          ideaData.ideas.splice(args.r,1)
          Helper.writeToFile(filepath,ideaData)
        }else{
          this.help("idea")
        }
      }

      if(ideaData.ideas.length<1){
        console.log("Now you have no tasks on list, add some ^_^ !")
      }else{
        if(showIdea){
          ideaData.ideas.map((v,i) => {
            if(v.status =="done"){
              console.log(`${Helper.Colors.FgGreen}${Helper.toLength(i,3)}\u2713 ${Helper.toLength(v.status,10)}${v.desc}${Helper.Colors.Reset}`)
            }else if(v.status == "ongoing"){
              console.log(`${Helper.Colors.FgGreen}${Helper.toLength(i,3)} ${Helper.toLength(v.status,10)}${v.desc}${Helper.Colors.Reset}`)
            }else{
              console.log(`${Helper.Colors.FgGreen}${Helper.toLength(i,3)} ${Helper.toLength(v.status,10)}${v.desc}${Helper.Colors.Reset}`)
            }
          })
        }
      }
    } 
  }
  // npm command
  npm(){
    var args = this.userArgs
    if(Helper.exists(args._[1]) && args._[1] == "update"){
      var packages = Helper.execSync('npm outdated').toString()
      packages = packages.split(/\n/).slice(1,packages.length)
      packages.pop()
      var temp = {}
      packages.map((v) => {
        var re = /[a-zA-Z0-9-_\.]+\s*?/g
        var result = v.match(re)
        temp[result[0]] = {}
        temp[result[0]].current = result[1]
        temp[result[0]].wanted = result[2]
        temp[result[0]].latest = result[3]
      })
      packages = temp
      //delete temp
      if(args.latest){
        Helper.npmHelper(packages)
      }else{
        Helper.npmHelper(packages,'wanted')
      }
    }
  }
  // open leetcode
  oj(){
    var args = this.userArgs
    Helper.exec('open https://leetcode.com/problemset/algorithms/', (out) => {
      Helper.sayGoodBye(args)
    })
  }
  // positive words!
  praise(){
    var args = this.userArgs
    var stdin = process.stdin;
    stdin.setRawMode( true );
    //stdin.resume();
    stdin.setEncoding( 'utf8' );
    stdin.on( 'data', ( key ) => {
      if ( key === 'c' || key == '\u0003' ) {
        process.exit();
      }
    });
    setInterval(Helper.praiseMe,2000)
  }  // random book from my reading list
  // Should support open novels?
  read(){
    var args = this.userArgs
    var filepath = ''
    var book_dir = process.env.HOME+"/readings"
    var books = fs.readdir(book_dir,(err,list) => {
      if (err) return err;
      var rightPrefix = false
      filepath = [book_dir + "/" + list[Math.floor(Math.random()*list.length)]]
      if(!Helper.exists(args._[1])){
        rightPrefix = true
      }
      var count = 0
      while(!rightPrefix && count < 300){
        var fName = list[Math.floor(Math.random()*list.length)]
        if(fName.toLowerCase().indexOf(args._[1].toLowerCase()) > -1){
          rightPrefix = true
          filepath = [book_dir + "/" + fName]
        }
        count ++
      }
      if(!rightPrefix){
        console.log(`${Helper.Colors.FgGreen} No match book found ! ${Helper.Colors.Reset}`)
      }else{
        var book = Helper.spawn('open',filepath)
        book.on('close',(code) => {
          args.action = "reading"
          Helper.sayGoodBye(args)
        })
      }
    })
  }
  // rss reader
  rss(){
    var args = this.userArgs
    // will use the request and cheerio to get and parse the html, maybe need phantomjs to help me deal with some dynamic stuff
  }
  // create a http server with specific directory
  serve(){
    var args = this.userArgs
    var pathname = path.join(__dirname,'./lib/babyUI/dist/')
    if(Helper.exists(args._[1])){
      pathname = path.join.apply(Helper.pathParser([process.cwd(),args._[1]]))
    }
    Helper.exec('open http://localhost:8000/')
    var handler = (request, response) => {
    
      var uri = url.parse(request.url).pathname
        , filename = path.join(pathname, uri);
      var dirstatus = Helper.fileExists(filename,'dir')
      var filestatus = Helper.fileExists(filename)
      if(!dirstatus && !filestatus) {
        if(filename.endsWith('css')){
          response.writeHead(404, {"Content-Type": "text/css"});
        }else{
          response.writeHead(404, {"Content-Type": "text/plain"});
        }
        response.write("404 Not Found\n");
        response.end();
        return;
      }

      if (fs.statSync(filename).isDirectory()) filename += '/index.html';
    
      fs.readFile(filename, (err, file) => {
        if(err) {
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.write(err + "\n");
          response.end();
          return;
        }
    
        if(filename.endsWith('css')){
          response.writeHead(200,{"Content-Type": "text/css"});
        }else{
          response.writeHead(200);
        }
        response.end(file);
      });
    }
    var app = http.createServer(handler)
    var io = require('socket.io')(app)
    app.listen(8000);

    io.on('connection', (socket) => {
      socket.on('exit', (data) => {
        //Tasks.todo(data)
        Helper.sayGoodBye(args)
      });
      socket.on('giveMeSummaryData', (data) => {
        var filepath = path.join(__dirname,'./data/.gSummary.json')
        var summaryData = JSON.parse(fs.readFileSync(filepath))
        socket.emit("summaryData",summaryData)
      });

      socket.on('giveMeTodoData', (data) => {
        var filepath = path.join(__dirname,'./data/.todo.json')
        var todoList = JSON.parse(fs.readFileSync(filepath))
        socket.emit("todoData",todoList)
      });
      socket.on('bye', (data) => {
      });
      socket.on('writeTodo', (data) => {
        var filepath = path.join(__dirname,'./data/.todo.json')
        Helper.writeToFile(filepath,data)
        console.log("Todo data file updated!")
      });

      // TODO: combine them into one listener and emitter
      var FeedSpider = require('./lib/feedAPI'),
          //socketHandler = require('./lib/socketHandler'),
          feed = new FeedSpider(),
          allData = {},
          readData = []
      socket.on("rss", (request) =>{
        feed.db.open((err, db) =>{
          switch (request.type) {
            case "auth":
              feed.authenticate(request.user).then( (exist) => {
                var response = {}
                if(exist){
                  response.status = 1;
                  response.type = "auth";
                  response.data = "Welcome back!";
                }else{
                  response.status = 0;
                  response.type = "auth";
                  response.data = "User doesn't exist!";
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
                    console.log("Got feed data")
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
                    response.type = "more";
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
    });
    
    console.log("Static file server running at\n  => http://localhost:8000/\nCTRL + C to shutdown");
  }
  // put the display to sleep
  sleep(){
    var args = this.userArgs
    var delay = args._[1] || args["t"] || args["time"] || 2
    console.log("will sleep after "+delay+" seconds, happy rest!")
    setTimeout(() => {
      // Helper.exec('system_profiler SPUSBDataType | grep TaoAlpha',Helper.exec('pmset displaysleepnow'))
      Helper.exec('pmset displaysleepnow')
    },delay*1000)
  }
  // connect ssh
  ssh(){
    var args = this.userArgs
    var presetaddresses = {
      weirss : ["root@weirss.me"],
      pi: ["pi@104.229.171.106"]
      ,gary : ["gary@zzgary.info","-p","2120"]
      ,juan : ["root@www.51juanzeng.com"]
      ,aws : ["-i",process.env.HOME+"/temp/taoalpha.pem","ubuntu@52.32.254.98"]
      ,groupfinder : ["-i",process.env.HOME+"/temp/aws.pem","ubuntu@52.26.51.6"]
    }
    var address = ""
    if(args._[1]){
      address = [args._[1]]
    }else if(args.n){
      address = presetaddresses[args.n]
    }
    var ssh = Helper.spawn('ssh',address)
    ssh.on('close',(code) => {
      Helper.sayGoodBye(args)
    })
  }
  // gloabl statistics
  summary(data){
    var args = this.userArgs
    // need a config file
    var filepath = path.join(__dirname,'./data/.gSummary.json')
    var filestatus = Helper.fileExists(filepath)
    if(!filestatus){
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question("Will initialize the summary report (Y/n) ? ", (answer) => {
        if(answer.toLowerCase() == "y"){
          var data = {}
          data.total= 0
          data.coding = {}
          data.coding.addCount = 0
          data.coding.delCount = 0
          data.coding.days = {}
          Helper.writeToFile(filepath,data)
          Helper.sayGoodBye(args)
        }
        rl.close();
      });
    }else{
      var summaryReport = require(filepath)
      var today = new Date().toLocaleDateString()
      // clean the log and keep records up to 30 days || config.LOGDAYS
      var logdays = args.CONFIG.logdays || 60
      if(Object.keys(summaryReport.coding.days).length > logdays){
        var prev = new Date((new Date()).setDate((new Date()).getDate()-logdays)).toLocaleDateString()
        for(var i in summaryReport.coding.days){
          if(new Date(i)<new Date(prev)){
            delete summaryReport.coding.days[i]
          }
        }
      }
      if(!summaryReport.coding.days[today]){
        summaryReport.coding.days[today] = {}
        summaryReport.coding.days[today].addCount = 0
        summaryReport.coding.days[today].delCount = 0
      }
      // show or write the records to the data
      if(args._[1] == "coding" && data){
        if(!summaryReport.coding.days[today]){
          summaryReport.coding.days[today] = {}
          summaryReport.coding.days[today].addCount = data.addCount
          summaryReport.coding.days[today].delCount = data.delCount
        }
        summaryReport.coding.addCount += data.addCount
        summaryReport.coding.delCount += data.delCount
        summaryReport.coding.days[today].addCount += data.addCount
        summaryReport.coding.days[today].delCount += data.delCount
        Helper.writeToFile(filepath,summaryReport)
      }else{
        console.log(`You have made ${Helper.Colors.FgGreen} + ${summaryReport.coding.addCount} ${Helper.Colors.Reset} insertions and ${Helper.Colors.FgRed} - ${summaryReport.coding.delCount} ${Helper.Colors.Reset} deletions!`)
        console.log(`${Helper.Colors.FgYellow}Special for today:${Helper.Colors.Reset} you have made ${Helper.Colors.FgGreen} + ${summaryReport.coding.days[today].addCount} ${Helper.Colors.Reset} insertions and ${Helper.Colors.FgRed} - ${summaryReport.coding.days[today].delCount} ${Helper.Colors.Reset} deletions!`)
      }
    }
  }
  // todo task
  todo(){
    var args = this.userArgs
    var filepath = path.join(__dirname,'./data/.todo.json')
    var filestatus = Helper.fileExists(filepath)
    // deal with no file and open the server
    if(!filestatus){
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question("Will initialize the task profile (Y/n) ? ", (answer) => {
        if(answer.toLowerCase() == "y"){
          var data = {}
          data.total = 0
          data.creationTime = moment().format()
          data.lastUpdated = moment().format()
          data.data = {}
          data.oldData = {}
          data.doneItems = 0
          Helper.writeToFile(filepath,data)
          Helper.sayGoodBye(args)
        }
        rl.close();
      });
    }else{
      var content = require(filepath)
      // build several mappers
      var allMapper = []
      for(var dayItem in content.data){
        content.data[dayItem].items.map(function(v){
          var singleItem = {}
          singleItem.parent = content.data[dayItem]
          singleItem.pointer = v
          singleItem.content = v.content
          singleItem.status = v.status
          singleItem.done = v.done
          allMapper.push(singleItem)
        })
      }
      // mapper is used to access item with index so that we can mark it as done or undone
      var showList = () =>{
        if(content.total<1){
          console.log("Now you have no tasks on list, add some ^_^ !")
        }else{
          var allMapper = []
          for(var dayItem in content.data){
            content.data[dayItem].items.map(function(v){
              var singleItem = {}
              singleItem.content = v.content
              singleItem.status = v.status
              singleItem.done = v.done
              allMapper.push(singleItem)
            })
          }
          allMapper.map((v,i) => {
            if(v.status == "done"){
              console.log(`${Helper.Colors.FgGreen}${Helper.toLength(i,3)}\u2713 ${Helper.toLength(v.status,10)}${v.content}${Helper.Colors.Reset}`)
            }else if(v.status == "ongoing"){
              console.log(`${Helper.Colors.FgRed}${Helper.toLength(i,5)}${Helper.toLength(v.status,10)}${v.content}${Helper.Colors.Reset}`)
            }else if(v.status == "obsolete"){
              console.log(`${Helper.Colors.FgYellow}${Helper.toLength(i,5)}${Helper.toLength(v.status,10)}${v.content}${Helper.Colors.Reset}`)
            }
          })
        }
        content.lastUpdated = moment().format()
        Helper.writeToFile(filepath,content)
      }
      // special for json api
      if(args.json){
        return filepath
      }
      // special for only `bb t`
      if(Object.keys(args).length == 2){
        showList()
        return
      }
      if(Helper.exists(args.a)){
        if(args.a  && args.a !== true){
          var newItem = {}
          newItem.content= args.a
          newItem.status = "ongoing"
          newItem.done = false
          newItem.addTime = moment().format()
          var dateID = newItem.addTime.split("T")[0]
          content.data[dateID] = content.data[dateID] || {}
          content.data[dateID].doneItems = content.data[dateID].doneItems || 0
          content.data[dateID].addTime = content.data[dateID].addTime || moment().format()
          content.data[dateID].items = content.data[dateID].items || []
          content.data[dateID].items.unshift(newItem)
          content.total += 1
          showList()
        }else{
          console.log(`No item found!`)
          this.help("todo")
        }
      }
      if(Helper.exists(args.e)){
        if(args.e !== true && parseInt(args.e) == parseInt(args.e)){
          allMapper[args.e].pointer.content = args._[1]
          showList()
        }else{
          console.log(`No task specified!`)
          this.help("todo")
        }
      }
      if(Helper.exists(args.d)){
        if(args.d !== true && parseInt(args.d) == parseInt(args.d)){
          allMapper[parseInt(args.d)].pointer.status = "done"
          allMapper[parseInt(args.d)].pointer.done = true
          allMapper[parseInt(args.d)].pointer.doneTime = moment().format()
          allMapper[parseInt(args.d)].parent.doneItems += 1
          content.doneItems += 1
          showList()
        }else{
          if(Object.keys(content.data).length<1){
            console.log("Now you have no tasks on list, add some ^_^ !")
          }else{
            // show all items that marked as done - how good you are!!
            var doneMapper = []
            allMapper.map((v,i) =>{
              if(v.done){
                doneMapper.push(v)
              }
            })
            doneMapper.map((v,i) => {
              console.log(`${Helper.Colors.FgGreen}${Helper.toLength(i,3)}\u2713 ${Helper.toLength(v.status,10)}${v.content}${Helper.Colors.Reset}`)
            })
          }
          this.help("todo")
          return
        }
      }
      if(Helper.exists(args.u)){
        if(args.u !== true && parseInt(args.u) == parseInt(args.u)){
          allMapper[args.u].pointer.status = "ongoing"
          allMapper[parseInt(args.u)].pointer.doneTime = ''
          allMapper[parseInt(args.u)].pointer.done = false
          allMapper[parseInt(args.u)].parent.doneItems += -1
          content.doneItems += -1
          showList()
        }else{
          console.log(`no task specified!`)
          this.help("todo")
        }
      }
      if(Helper.exists(args.clean)){
        // clean all task to oldData
        for(var dayItem in content.data){
          content.oldData[dayItem] = content.data[dayItem]
        }
        content.data = {}
        content.total = 0
        content.doneItems = 0
        showList()
      }
      if(Helper.exists(args.clear)){
        content.data = {}
        content.oldData = {}
        content.total = 0 
        showList()
      }
      if(Helper.exists(args.r)){
        if(args.r !== true && parseInt(args.r) == parseInt(args.r)){
          // should delete the item
        }
        // content.total = parseInt(content.total) - 1
      } 
    }
  }
  // collection of tools
  tool(){
    var args = this.userArgs
    switch (args._[1]){
      case "pf":
        // print the file structure of current working directory
        Helper.printFiles(process.cwd())
        break;
      case "rp":
        // find repeated part of your code with similarity of string
        Helper.calculateRepeat(args._[2])
        break;
      default:
        this.help("todo")
    }
  }
  // show help
  help(){
    var args = this.userArgs
    var helpDoc = {
      usage:{
        init:    "baby init [-e]                     Initial with default configuration or edit the configuration",
        blog:    "baby blog <command>                create new post",
        cdn:     "baby cdn <prefix>                  Search for popular front-end frameword with cdnjs resoureces", 
        edit:    "baby edit <path-to-file> ...       Edit one file, use vim as the default editor",
        idea:    "baby idea [ -a -d -r -e ] ...      A simple idea collection tool",
        npm:     "baby npm <command> [--latest]      Help update local npm modules to the latest or wanted version",
        oj:      "baby oj                            open the oj with a random question",
        praise:  "baby praise                        Show me some positive energy",
        read:    "baby read                          Pick a random book from my reading list and open it",
        rss:     "baby rss                           Under constructing...",
        serve:   "baby serve <path>                  Create a http server with any path", 
        sleep:   "baby sleep [-t | --time]           Close the display within specific duration",
        ssh:     "baby ssh <address> [-n | --name]   Log in with an address or a shortcut name",
        summary: "baby summary                       Show a simple statistic of editing activity etc",
        todo:    "baby todo [ -a -d -e ] ...         A simple todo command tool",
        tool:    "baby tool <command>                Access all handy tools from here",
        help:    "baby help <command>                Show this screen",
      },
      option:{
        0:"-h,--help       Show this screen.",
        1:"-v,--version    Show version.", 
        2:"-t,--time       Set delay time for sleep",
        3:"-n,--name       Use pre-saved shortcuts of ssh address",
        4:"-a,--add        Add new task to todo list",
        5:"-d,--done       Mark specific task as done",
        6:"-e,--edit       Edit specific task in todo list",
        7:"-u,--undone     Mark specific task as undone",
        8:"-r,--remove     Remove specific task"
      }
    }
    console.log("Welcome to baby ! ^_^")
    if(typeof args === "string"){
      console.log(helpDoc.usage[args])
    }else if(args._[1] && helpDoc.usage.hasOwnProperty(args._[1])){
      console.log(helpDoc.usage[args._[1]])
    }else{
      console.log("Usage:")
      for(var item in helpDoc.usage){
        console.log("  "+helpDoc.usage[item])
      }
      console.log("\nOptions:")
      for(item in helpDoc.option){
        console.log("  "+helpDoc.option[item])
      }
    }
  }
}

// agreement on this project
// will use snake_case or spinal-case for variables
// will use camelCase for functions
// will use CamelCase for class or global objec

//var complete = omelette("baby <action> <option> <value>");
//
//complete.on("action", function() {
//  var list = fs.readdirSync(".")
//  list = list.concat(["edit", "todo", "ssh","cdn","summary","read","serve","tool","npm","praise","oj","help","init"])
//  this.reply(list)
//});
//
//complete.on("option", function(action) {
//  switch (action){
//    case "todo":
//      this.reply(['-a','-e','-d','-u','--clean'])
//      break
//    case "idea":
//      this.reply(['-a','-e'])
//      break
//    case "ssh":
//      this.reply(['-n'])
//      break
//    case "tool":
//      this.reply(["pf"])
//      break
//    case "npm":
//      this.reply(["install"])
//      break
//    case "cdn":
//      var cdnjs = require("../data/cdnjs.json") 
//      this.reply(Object.keys(cdnjs))
//      break
//    case "edit":
//      this.reply(fs.readdirSync("./"+action))
//      break
//    default:
//      this.reply(fs.readdirSync("./"+action))
//  }
//});
//
//complete.on("value",function(option){
//  switch (option){
//    case "-n":
//      this.reply(["groupfinder","aws","gary","weirss"])
//      break
//    default:
//      var prev = arguments[1].split(" ")[1]
//      this.reply(fs.readdirSync("./"+prev+"/"+option))
//  }
//})
//

module.exports = Baby
