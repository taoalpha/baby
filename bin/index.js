#! /usr/bin/env node
// modules from third party
var parseArgs = require('minimist')
var readline = require('readline')
var child = require('child_process')
var path = require("path")
var url = require("url")
var fs = require("fs")
var Trie = require("../lib/trie")
var http = require('http')
//var complete = require('../lib/complete')

// get arguments
var userArgs = parseArgs(process.argv.slice(2))


//complete({
//  program: 'baby',
//  // Commands
//  commands: {
//    'sleep': function(words, prev, cur) {
//      complete.output(cur, ['-t']);
//    },
//    'edit': {
//      'hi': function(words, prev, cur) {
//        complete.echo('next');
//      }
//    }
//  },
//  options: {
//    '--help': {},
//    '-h': {},
//    '--version': {},
//    '-v': {}
//  }
//});



var Tasks = {
  // put the display to sleep
  sleep:function(args){
    var delay = args._[1] || args["t"] || args["time"] || 2
    console.log("will sleep after "+delay+" seconds, happy rest!")
    setTimeout(function(){
     child.exec('system_profiler SPUSBDataType | grep TaoAlpha', function(err, stdout, stderr) {
        child.exec('pmset displaysleepnow')
      })
    },delay*1000)
  },
  // edit some file or this script
  edit:function(args){
    var initial_lines = 0, end_lines = 0,filepath = ''
    if(args._[1]){
      filepath = path.join.apply(path,pathParser([process.cwd(),args._[1]]))
    }else{
      filepath = __dirname+'/index.js'
    }
    child.exec("wc -w "+filepath,function(err,out,stderr){
      initial_lines = out.split("/")[0]
    })
    var vim = child.spawn('vim',[filepath],{
      stdio:'inherit'
    })
    vim.on('close',function(code){
      // no output ?
      child.exec("wc -w "+filepath,function(err,out,stderr){
        end_lines = out.split("/")[0] 
        var color = Colors.FgGreen + "+ "
        args._[1] = 'coding'
        var data = {}
        data.addCount = end_lines - initial_lines
        data.delCount = 0
        if(end_lines - initial_lines == 0){
          color = Colors.FgYellow
        }
        if(end_lines - initial_lines < 0){
          data.delCount = initial_lines - end_lines
          data.addCount = 0
          color = Colors.FgRed
        }
        if(end_lines - initial_lines !== 0){
          Tasks.summary(args,data)
        }
        console.log(`You have made ${color}${ end_lines - initial_lines }${Colors.Reset} changes !`)
        sayGoodBye() 
      });
    })
  },
  // todo task
  todo:function(args){
    var filepath = path.join(__dirname,'../data/todo.json')
    var filestatus = fileExists(filepath)
    if(!filestatus){
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question("Will initialize the task profile (Y/n) ? ", function(answer) {
        if(answer.toLowerCase() == "y"){
          var data = {}
          data.total = 0
          data.items = []
          data.doneItems = []
          fs.writeFileSync(filepath,JSON.stringify(data))
          sayGoodBye()
        }
        rl.close();
      });
    }else{
      var content = require(filepath)
      //JSON.parse(fs.readFileSync(filepath))
      var todoLists = content.items
      if(exists(args.a)){
        if(args.a  && args.a !== true){
          var newTask = {}
          newTask.task = args.a
          newTask.status = "ongoing"
          newTask.addTime = new Date()+''
          newTask.doneTime = ''
          todoLists.push(newTask)
          content.total = parseInt(content.total) + 1
        }else{
          console.log(`No task found!`)
          Tasks.help("todo")
        }
      }
      if(exists(args.e)){
        if(args.e !== true && parseInt(args.e) == parseInt(args.e)){
          todoLists[args.e].task = args._[1]
        }else{
          console.log(`No task specified!`)
          Tasks.help("todo")
        }
      }
      if(exists(args.d)){
        if(args.d !== true && parseInt(args.d) == parseInt(args.d)){
          todoLists[parseInt(args.d)].status = "done"
          todoLists[parseInt(args.d)].doneTime = new Date()+''
        }else{
          if(content.items.length<1){
            console.log("Now you have no tasks on list, add some ^_^ !")
          }else{
            content.doneItems.map(function(v,i){
              if(v.status == "done"){
                console.log(`${Colors.FgGreen}${toLength(i,3)}\u2713 ${toLength(v.status,10)}${v.task}${Colors.Reset}`)
              }
            })
          }
          Tasks.help("todo")
          return
        }
      }
      if(exists(args.u)){
        if(args.u !== true && parseInt(args.u) == parseInt(args.u)){
          todoLists[args.u].status = "ongoing"
          todoLists[parseInt(args.u)].doneTime = ''
        }else{
          console.log(`no task specified!`)
          Tasks.help("todo")
        }
      }
      if(exists(args.clean)){
        // clean the done tasks
        for(var i =0;i<content.items.length;i++){
          if(content.items[i].status == "done"){
            content.doneItems.push(content.items.splice(i,1)[0])
            i --
          }
        }
      }
      if(exists(args.clear)){
        content.items = []
        content.total = 0 
      }
      if(exists(args.r)){
        if(args.r !== true && parseInt(args.r) == parseInt(args.r)){
          todoLists.splice(parseInt(args.r),1)
        }
        content.total = parseInt(content.total) + 1
      }

      if(content.items.length<1){
        console.log("Now you have no tasks on list, add some ^_^ !")
      }else{
        content.items.map(function(v,i){
          if(v.status == "done"){
            console.log(`${Colors.FgGreen}${toLength(i,3)}\u2713 ${toLength(v.status,10)}${v.task}${Colors.Reset}`)
          }else if(v.status == "ongoing"){
            console.log(`${Colors.FgRed}${toLength(i,5)}${toLength(v.status,10)}${v.task}${Colors.Reset}`)
          }else if(v.status == "obsolete"){
            console.log(`${Colors.FgYellow}${toLength(i,5)}${toLength(v.status,10)}${v.task}${Colors.Reset}`)
          }
        })
      }
      fs.writeFileSync(filepath,JSON.stringify(content))
    }
  },
  // positive words!
  praise:function(args){
    var stdin = process.stdin;
    stdin.setRawMode( true );
    //stdin.resume();
    stdin.setEncoding( 'utf8' );
    stdin.on( 'data', function( key ){
      if ( key === 'c' || key == '\u0003' ) {
        process.exit();
      }
    });
    setInterval(praiseMe,2000)
  },
  // gloabl statistics
  summary:function(args,data){
    // need a config file
    var filepath = path.join(__dirname,'../data/gSummary.json')
    var filestatus = fileExists(filepath)
    if(!filestatus){
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question("Will initialize the summary report (Y/n) ? ", function(answer) {
        if(answer.toLowerCase() == "y"){
          var data = {}
          data.total= 0
          data.coding = {}
          data.coding.addCount = 0
          data.coding.delCount = 0
          data.coding.days = {}
          fs.writeFileSync(filepath,JSON.stringify(data))
          sayGoodBye()
        }
        rl.close();
      });
    }else{
      var summaryReport = require(filepath)
      var today = new Date().toJSON().slice(0,10)
      // clean the log and keep records up to 30 days || config.LOGDAYS
      var logdays = args.CONFIG.logdays || 30
      if(Object.keys(summaryReport.coding.days).length > logdays){
        // need to deal with the datetime type...
        var prev = new Date((new Date()).setDate((new Date()).getDate()-logdays)).toJSON().slice(0,10)
        for(var i in summaryReport.coding.days){
          if(i<prev){
            delete summaryReport.coding.days[i]
          }
        }
      }
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
        fs.writeFileSync(filepath,JSON.stringify(summaryReport))
      }else{
        console.log(`You have made ${summaryReport.coding.addCount + summaryReport.coding.delCount} modifications in total! Congratulations!`)
        console.log(`There are ${Colors.FgGreen} + ${summaryReport.coding.addCount} ${Colors.Reset} insertions and ${Colors.FgRed} - ${summaryReport.coding.delCount} ${Colors.Reset} deletions!`)
        console.log(`Special for today: you have made ${Colors.FgGreen} + ${summaryReport.coding.days[today].addCount} ${Colors.Reset} insertions and ${Colors.FgRed} - ${summaryReport.coding.days[today].delCount} ${Colors.Reset} deletions!`)
      }
    }
  },
  // connect ssh
  ssh:function(args){
    var presetaddresses = {
      weirss : ["root@weirss.me"]
      ,gary : ["gary@zzgary.info","-p","2120"]
      ,aws : ["-i",process.env.HOME+"/temp/taoalpha.pem","ubuntu@52.32.254.98"]
      ,groupfinder : ["-i",process.env.HOME+"/temp/aws.pem","ubuntu@52.26.51.6"]
    }
    var address = ""
    if(args._[1]){
      address = [args._[1]]
    }else if(args.n){
      address = presetaddresses[args.n]
    }
    var ssh = child.spawn('ssh',address,{
      stdio:'inherit'
    });
    ssh.on('close',function(code){
      sayGoodBye()
    })
  },
  // search cdnjs
  cdn:function(args){
    if(args._[1]){
      var cdnjs = require("../data/cdnjs.json") 
      var trieData = require("../data/trie.json") 
      var count = 0
      var tree = new Trie()
      tree.root = trieData.root
      //for(var item in cdnjs){
      //  tree.insert(item)
      //}
      //fs.writeFileSync("../data/trie.json",JSON.stringify(tree))
      tree.autocomplete(args._[1]).slice(0,10).map(function(v){
        var fixLenghtItem = toLength(v,30)
        console.log(`${fixLenghtItem}${cdnjs[v]}`)
      })

    }else{
      Tasks.help("cdn")
    }
  },
  // random book from my reading list
  read:function(args){
    var filepath = ''
    var book_dir = process.env.HOME+"/readings"
    if(args._[1]){
      filepath = [args._[1]]
    }else{
      var books = fs.readdir(book_dir,function(err,list){
        if (err) return err;
        filepath = [book_dir + "/" + list[Math.floor(Math.random()*list.length)]]
        var book = child.spawn('open',filepath,{
          stdio:'inherit'
        });
        book.on('close',function(code){
          sayGoodBye("reading")
        })
      })
    }
  },
  // rss reader
  rss:function(args){
    
  },
  //angularjs
  serve:function(args){
    var pathname = path.join(__dirname,'../lib/angular/')
    if(exists(args._[1])){
      pathname = path.join.apply(pathParser([process.cwd(),args._[1]]))
    }
    child.exec('open http://localhost:8080/', function(err, stdout, stderr) {})
    var handler = function(request, response) {
    
      var uri = url.parse(request.url).pathname
        , filename = path.join(pathname, uri);
      
      var filestatus = fileExists(filename,'dir')
      if(!filestatus) {
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("404 Not Found\n");
        response.end();
        return;
      }
    
      if (fs.statSync(filename).isDirectory()) filename += '/index.html';
    
      fs.readFile(filename, function(err, file) {
        if(err) {        
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.write(err + "\n");
          response.end();
          return;
        }
    
        response.writeHead(200);
        response.end(file);
      });
    }
    var app = http.createServer(handler)
    var io = require('socket.io')(app)
    app.listen(8080);

    io.on('connection', function (socket) {
      socket.on('exit', function (data) {
        //Tasks.todo(data)
        sayGoodBye()
      });
    });
    
    console.log("Static file server running at\n  => http://localhost:8080/\nCTRL + C to shutdown");
  },
  // open leetcode
  oj:function(args){
    child.exec('open https://leetcode.com/problemset/algorithms/', function(err, stdout, stderr) {
      sayGoodBye()
    })
  },
  // npm command
  npm:function(args){
    if(exists(args._[1]) && args._[1] == "update"){
      var packages = child.execSync('npm outdated').toString()
      packages = packages.split(/\n/).slice(1,packages.length)
      packages.pop()
      var temp = {}
      packages.map(function(v){
        var re = /[a-zA-Z0-9-_\.]+\s*?/g
        var result = v.match(re)
        temp[result[0]] = {}
        temp[result[0]].current = result[1]
        temp[result[0]].wanted = result[2]
        temp[result[0]].latest = result[3]
      })
      packages = temp
      delete temp
      if(args.latest){
        npmHelper(packages)
      }else{
        npmHelper(packages,'wanted')
      }
    }
  },
  // initial the config file
  init:function(args){
    var configuration = {}
    configuration.username = "Tao"
    configuration.summary = true
    configuration.todoFilePath = ''
    var filepath = path.join(__dirname,'config.json')
    if(!fileExists(filepath)){
      console.log("Initialize with default configuration.")
      fs.writeFileSync(filepath,JSON.stringify(configuration))
    }else if(args.e){
      args._[1] = filepath
      Tasks.edit(args)
    }else{
      var config = JSON.parse(fs.readFileSync(filepath))
      console.log("You already have one configuration file here: "+filepath)
      console.log(config)
      console.log("Use 'baby init -e' to edit your configuration file.")
    }
  },
  // collection of tools
  tool:function(args){
    if(args._[1] == "pf"){
      printFiles(process.cwd())
    }
  },
  // show help
  help:function(args){
    var helpDoc = {
      usage:{
        edit:    "baby edit <path-to-file> ...       Edit one file, use vim as the default editor",
        sleep:   "baby sleep [-t | --time]           Close the display within specific duration",
        ssh:     "baby ssh <address> [-n | --name]   Log in with an address or a shortcut name",
        praise:  "baby praise                        Show me some positive energy",
        read:    "baby read                          Pick a random book from my reading list and open it",
        todo:    "baby todo [ -a -d -e ] ...         A simple todo command tool",
        serve:   "baby serve <path>                  Create a http server with any path", 
        npm:     "baby npm <command> [--latest]      Help update local npm modules to the latest or wanted version",
        summary: "baby summary                       Show a simple statistic of editing activity etc",
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

// Praise me ^_^
function praiseMe(){
  var adj = ["awesome","fantastic","wonderful","fabulous","outstanding","legendary","great","briliant","talented","amazing"]
  console.log(`${Colors[pickRandomProperty(Colors)]}Tao, You are truly ${adj[Math.floor(Math.random()*adj.length)]}!${Colors.Reset}`)
}

// Colors 
var Colors = {
Reset : "\x1b[0m"
,FgRed : "\x1b[31m"
,FgGreen : "\x1b[32m"
,FgYellow : "\x1b[33m"
,FgBlue : "\x1b[34m"
,FgMagenta : "\x1b[35m"
,FgCyan : "\x1b[36m"
,FgWhite : "\x1b[37m"
,BgBlack : "\x1b[40m"
,BgRed : "\x1b[41m"
,BgGreen : "\x1b[42m"
,BgYellow : "\x1b[43m"
,BgBlue : "\x1b[44m"
,BgMagenta : "\x1b[45m"
,BgCyan : "\x1b[46m"
}

// helper functions for picking random property from an object
function pickRandomProperty(obj) {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1/++count)
           result = prop;
    return result;
}

// say good bye

function sayGoodBye(action) {
  action = action || "coding"
  console.log(`${Colors.FgGreen}Happy ${action}, ${userArgs.CONFIG.username || 'tao'} !${Colors.Reset}`)
}

// check whether variable or property exist or not
function exists(val){
  return typeof val !== "undefined"
}

// Fix length for string
function toLength(val,len){
  var val = val+""
  return (val+(new Array(val.length*10)).join(" ")).slice(0,len)
}

// check whether file or directory exists or not
function fileExists(filePath,type)
{
  if(type=="dir"){
    try{
      return fs.statSync(filePath).isDirectory();
    }catch (err){
      return false;
    }
  }
  try{
    return fs.statSync(filePath).isFile();
  }catch (err){
    return false;
  }
}

// path parser

function pathParser(args){
  var oLen = args.length
  for(var i = 0;i<oLen;i++){
    if(args[i][0] === '~' || args[i][0] === '/'){
      var cutLen = args.splice(0,i).length
      oLen -= cutLen
      i -= cutLen
    }
  }
  return args
}

// helper for npm
function npmHelper(packages,flag){

  if(Object.keys(packages).length == 0){
    sayGoodBye()
    return
  }else{
    var item = Object.keys(packages)[0]
    var version = "latest"
    if(flag == "wanted"){
      version = packages[item].wanted
    }
    console.log('Installing '+item)
    var single = child.spawn('npm',['install',item+'@'+version,'--save'],{
      stdio:"inherit"
    })
    single.on('close',function(){
      delete packages[item]
      npmHelper(packages)
    })
  }
}

// print files under a specific path
var printFiles = function(pathname,step){
  var step = step || 1
  //console.log(toLength('====================',step*2)+pathname)
  var fileList = fs.readdirSync(pathname)
  //,function(err,list){
  if(!fileList.length) {console.log("no files");return}
  for(var v in fileList){
    console.log(toLength('----------------------------',step*3)+fileList[v])
    var newpath = path.join(pathname,fileList[v])
    if(fileExists(newpath,'dir')){
      printFiles(newpath,step+1)
    }
  }
}


// assign tasks according to the args

var shortName = {
  e:"edit",
  h:"help",
  s:"sleep",
  r:"read",
  p:"praise",
  kuawo:"praise",
  t:"todo",
  ss:"ssh"
}

// load config file first if exists
// should be some useful and basic information
// like Enable the summary report
// or Customize the path of the data file
var configFile = path.join(__dirname,'config.json')
if(fileExists(configFile)){
  userArgs.CONFIG = require(configFile)
}

if(userArgs._[0]){
  if(Tasks.hasOwnProperty(userArgs._[0])){
    Tasks[userArgs._[0]](userArgs)
  }else if(shortName.hasOwnProperty(userArgs._[0])){
    Tasks[shortName[userArgs._[0]]](userArgs)
  }else if(fileExists(userArgs._[0])){
    userArgs._[1] = userArgs._[0]
    Tasks.edit(userArgs)
  }else{
    Tasks["help"](userArgs)
  }
}else{
  Tasks["help"](userArgs)
}
