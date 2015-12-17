#! /usr/bin/env node
// modules from third party
var parseArgs = require('minimist')
var readline = require('readline')
var path = require("path")
var url = require("url")
var fs = require("fs")
var Trie = require("../lib/trie")
var http = require('http')
var omelette = require("omelette");
var Helper = require('./helper')


// agreement on this project
// will use snake_case or spinal-case for variables
// will use camelCase for functions
// will use CamelCase for class or global objec

var complete = omelette("baby <action> <option> <value>");

complete.on("action", function() {
  var list = fs.readdirSync(".")
  list = list.concat(["edit", "todo", "ssh","cdn","summary","read","serve","tool","npm","praise","oj","help","init"])
  this.reply(list)
});

complete.on("option", function(action) {
  switch (action){
    case "todo":
      this.reply(['-a','-e','-d','-u','--clean'])
      break
    case "idea":
      this.reply(['-a','-e'])
      break
    case "ssh":
      this.reply(['-n'])
      break
    case "tool":
      this.reply(["pf"])
      break
    case "npm":
      this.reply(["install"])
      break
    case "cdn":
      var cdnjs = require("../data/cdnjs.json") 
      this.reply(Object.keys(cdnjs))
      break
    case "edit":
      this.reply(fs.readdirSync("./"+action))
      break
    default:
      this.reply(fs.readdirSync("./"+action))
  }
});

complete.on("value",function(option){
  switch (option){
    case "-n":
      this.reply(["groupfinder","aws","gary","weirss"])
      break
    default:
      var prev = arguments[1].split(" ")[1]
      this.reply(fs.readdirSync("./"+prev+"/"+option))
  }
})

// Initialize the omelette.

// get arguments
var userArgs = parseArgs(process.argv.slice(2))

var Tasks = {
  // initial the config file
  init : (args) => {
    var configuration = {}
    configuration.username = "Tao"
    configuration.summary = true
    configuration.todoFilePath = ''
    var filepath = path.join(__dirname,'.config.json')
    if(!Helper.fileExists(filepath)){
      console.log("Initialize with default configuration.")
      Helper.writeToFile(filepath,configuration)
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
  // search cdnjs
  cdn : (args) => {
    if(args._[1]){
      var cdnjs = require("../data/cdnjs.json") 
      var trieData = require("../data/trie.json") 
      var count = 0
      var tree = new Trie()
      tree.root = trieData.root
      // build the trie tree at the first time
      //for(var item in cdnjs){
      //  tree.insert(item)
      //}
      //fs.writeFileSync("../data/trie.json",JSON.stringify(tree))
      tree.autocomplete(args._[1]).slice(0,10).map((v) => {
        var fixLenghtItem = Helper.toLength(v,30)
        console.log(`${fixLenghtItem}${cdnjs[v]}`)
      })

    }else{
      Tasks.help("cdn")
    }
  },
  // edit some file or this script
  edit : (args) => {
    var initial_lines = 0, end_lines = 0,filepath = ''
    if(args._[1]){
      filepath = path.join.apply(path,Helper.pathParser([process.cwd(),args._[1]]))
    }else{
      filepath = __dirname+'/index.js'
    }
    // get the initial number of lines
    Helper.exec("wc -l "+filepath,(out) => {initial_lines = out.split("/")[0]})
    var vim = Helper.spawn('vim',[filepath])
    vim.on('close',(code) => {
      Helper.exec("wc -l "+filepath,
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
            Tasks.summary(args,data)
          }
          console.log(`You have made ${color}${ end_lines - initial_lines }${Helper.Colors.Reset} changes !`)
          Helper.sayGoodBye(args) 
        }
      );
    })
  },
  // support git short name
  git : (args) => {
    if(Helper.exists(args._[1])){
      switch (args._[1]) {
        case "blog":
          break
        case "normal":
          break
      }
    }
  },
  // idea collection
  idea : (args) => {
    var filepath = path.join(__dirname,'../data/.idea.json')
    var filestatus = Helper.fileExists(filepath)
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
        }
        Helper.ask(questions,[],callback)
      }
      // mark the idea with done status
      if(Helper.exists(args.d)){
        if(args.d !== true && parseInt(args.d) == parseInt(args.d)){
          ideaData.ideas[args.d].status = "done"
          Helper.writeToFile(filepath,ideaData)
        }else{
          Tasks.help("idea")
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
            Tasks.idea(args)
          }
          Helper.ask(questions,[],callback)
          return
        }else{
          Tasks.help("idea")
        }
      }
      // remove current existing idea 
      if(Helper.exists(args.r)){
        if(args.r !== true && parseInt(args.r) == parseInt(args.r)){
          ideaData.ideas.splice(args.r,1)
          Helper.writeToFile(filepath,ideaData)
        }else{
          Tasks.help("idea")
        }
      }

      if(ideaData.ideas.length<1){
        console.log("Now you have no tasks on list, add some ^_^ !")
      }else{
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
  },
  // npm command
  npm : (args) => {
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
      delete temp
      if(args.latest){
        Helper.npmHelper(packages)
      }else{
        Helper.npmHelper(packages,'wanted')
      }
    }
  },
  // open leetcode
  oj : (args) => {
    Helper.exec('open https://leetcode.com/problemset/algorithms/', (out) => {
      Helper.sayGoodBye(args)
    })
  },
  // positive words!
  praise : (args) => {
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
  },
  // random book from my reading list
  // Should support open novels?
  read : (args) => {
    var filepath = ''
    var book_dir = process.env.HOME+"/readings"
    if(args._[1]){
      filepath = [args._[1]]
    }else{
      var books = fs.readdir(book_dir,(err,list) => {
        if (err) return err;
        filepath = [book_dir + "/" + list[Math.floor(Math.random()*list.length)]]
        var book = Helper.spawn('open',filepath)
        book.on('close',(code) => {
          args.action = "reading"
          Helper.sayGoodBye(args)
        })
      })
    }
  }, 
  // rss reader
  rss : (args) => {
    // will use the request and cheerio to get and parse the html, maybe need phantomjs to help me deal with some dynamic stuff
  },
  // create a http server with specific directory
  serve : (args) => {
    var pathname = path.join(__dirname,'../lib/angular/')
    if(Helper.exists(args._[1])){
      pathname = path.join.apply(Helper.pathParser([process.cwd(),args._[1]]))
    }
    Helper.exec('open http://localhost:8080/')
    var handler = (request, response) => {
    
      var uri = url.parse(request.url).pathname
        , filename = path.join(pathname, uri);
      
      var filestatus = Helper.fileExists(filename,'dir')
      if(!filestatus) {
        response.writeHead(404, {"Content-Type": "text/plain"});
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
    
        response.writeHead(200);
        response.end(file);
      });
    }
    var app = http.createServer(handler)
    var io = require('socket.io')(app)
    app.listen(8080);

    io.on('connection', (socket) => {
      socket.on('exit', (data) => {
        //Tasks.todo(data)
        Helper.sayGoodBye(args)
      });
      socket.on('getTodoList', (data) => {
        var todoList = Tasks.todo({"json":true})
        socket.emit("todoData",todoList)
      });
    });
    
    console.log("Static file server running at\n  => http://localhost:8080/\nCTRL + C to shutdown");
  },
  // put the display to sleep
  sleep : (args) => {
    var delay = args._[1] || args["t"] || args["time"] || 2
    console.log("will sleep after "+delay+" seconds, happy rest!")
    setTimeout(() => {
      // Helper.exec('system_profiler SPUSBDataType | grep TaoAlpha',Helper.exec('pmset displaysleepnow'))
      Helper.exec('pmset displaysleepnow')
    },delay*1000)
  },
  // connect ssh
  ssh : (args) => {
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
    var ssh = Helper.spawn('ssh',address)
    ssh.on('close',(code) => {
      Helper.sayGoodBye(args)
    })
  },
  // gloabl statistics
  summary : (args,data) => {
    // need a config file
    var filepath = path.join(__dirname,'../data/.gSummary.json')
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
      var logdays = args.CONFIG.logdays || 30
      if(Object.keys(summaryReport.coding.days).length > logdays){
        var prev = new Date((new Date()).setDate((new Date()).getDate()-logdays)).toLocaleDateString()
        for(var i in summaryReport.coding.days){
          if(i<prev){
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
  },
  // todo task
  todo : (args) => {
    var filepath = path.join(__dirname,'../data/.todo.json')
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
          data.creationTime = new Date()
          data.lastUpdated = new Date()
          data.items = []
          data.doneItems = []
          Helper.writeToFile(filepath,data)
          Helper.sayGoodBye(args)
        }
        rl.close();
      });
    }else{
      var content = require(filepath)
      if(args.json){
        return content
      }
      //JSON.parse(fs.readFileSync(filepath))
      var todoLists = content.items
      if(Helper.exists(args.a)){
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
      if(Helper.exists(args.e)){
        if(args.e !== true && parseInt(args.e) == parseInt(args.e)){
          todoLists[args.e].task = args._[1]
        }else{
          console.log(`No task specified!`)
          Tasks.help("todo")
        }
      }
      if(Helper.exists(args.d)){
        if(args.d !== true && parseInt(args.d) == parseInt(args.d)){
          todoLists[parseInt(args.d)].status = "done"
          todoLists[parseInt(args.d)].doneTime = new Date()+''
        }else{
          if(content.items.length<1){
            console.log("Now you have no tasks on list, add some ^_^ !")
          }else{
            content.doneItems.map((v,i) => {
              if(v.status == "done"){
                console.log(`${Helper.Colors.FgGreen}${Helper.toLength(i,3)}\u2713 ${Helper.toLength(v.status,10)}${v.task}${Helper.Colors.Reset}`)
              }
            })
          }
          Tasks.help("todo")
          return
        }
      }
      if(Helper.exists(args.u)){
        if(args.u !== true && parseInt(args.u) == parseInt(args.u)){
          todoLists[args.u].status = "ongoing"
          todoLists[parseInt(args.u)].doneTime = ''
        }else{
          console.log(`no task specified!`)
          Tasks.help("todo")
        }
      }
      if(Helper.exists(args.clean)){
        // clean the done tasks
        for(var i =0;i<content.items.length;i++){
          if(content.items[i].status == "done"){
            content.doneItems.push(content.items.splice(i,1)[0])
            i --
          }
        }
      }
      if(Helper.exists(args.clear)){
        content.items = []
        content.total = 0 
      }
      if(Helper.exists(args.r)){
        if(args.r !== true && parseInt(args.r) == parseInt(args.r)){
          todoLists.splice(parseInt(args.r),1)
        }
        content.total = parseInt(content.total) - 1
      }

      if(content.items.length<1){
        console.log("Now you have no tasks on list, add some ^_^ !")
      }else{
        content.items.map((v,i) => {
          if(v.status == "done"){
            console.log(`${Helper.Colors.FgGreen}${Helper.toLength(i,3)}\u2713 ${Helper.toLength(v.status,10)}${v.task}${Helper.Colors.Reset}`)
          }else if(v.status == "ongoing"){
            console.log(`${Helper.Colors.FgRed}${Helper.toLength(i,5)}${Helper.toLength(v.status,10)}${v.task}${Helper.Colors.Reset}`)
          }else if(v.status == "obsolete"){
            console.log(`${Helper.Colors.FgYellow}${Helper.toLength(i,5)}${Helper.toLength(v.status,10)}${v.task}${Helper.Colors.Reset}`)
          }
        })
      }
      Helper.writeToFile(filepath,content)
    }
  },
  // collection of tools
  tool : (args) => {
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
        Tasks.help("todo")
    }
  },
  // show help
  help : (args) => {
    var helpDoc = {
      usage:{
        init:    "baby init [-e]                     Initial with default configuration or edit the configuration",
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

// assign tasks according to the args

var shortName = {
  e:"edit",
  h:"help",
  s:"sleep",
  r:"read",
  p:"praise",
  kuawo:"praise",
  t:"todo",
  i:"idea",
  ss:"ssh"
}

// load config file first if exists
// should be some useful and basic information
// like Enable the summary report
// or Customize the path of the data file
var configFile = path.join(__dirname,'.config.json')
userArgs.CONFIG = {}
if(Helper.fileExists(configFile)){
  userArgs.CONFIG = require(configFile)
}

if(userArgs.CONFIG.autocompletion){
  complete.init()
}

if(userArgs._[0]){
  if(Tasks.hasOwnProperty(userArgs._[0])){
    Tasks[userArgs._[0]](userArgs)
  }else if(shortName.hasOwnProperty(userArgs._[0])){
    Tasks[shortName[userArgs._[0]]](userArgs)
  }else if(Helper.fileExists(userArgs._[0])){
    userArgs._[1] = userArgs._[0]
    Tasks.edit(userArgs)
  }else{
    var filepath = path.join(process.cwd(),userArgs._.join("/"))
    if(Helper.fileExists(filepath)){
      userArgs._[1] = filepath
      Tasks.edit(userArgs)
    }else{
      Tasks["help"](userArgs)
    }
  }
}else{
  Tasks["help"](userArgs)
}
