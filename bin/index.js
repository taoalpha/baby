#! /usr/bin/env node
// modules from third party
var parseArgs = require('minimist');
var child = require('child_process');
var fs = require("fs")
var Trie = require("../lib/trie")
//var complete = require('../lib/complete');

// get arguments
var userArgs = parseArgs(process.argv.slice(2));


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
    console.log(`will sleep after ${delay} seconds, happy rest!`);
    setTimeout(function(){
     child.exec('system_profiler SPUSBDataType | grep TaoAlpha', function(err, stdout, stderr) {
      //if(stdout.length>0){
        child.exec('pmset displaysleepnow')
      //}
      })
    },delay*1000)
  },
  // edit some file or this script
  edit:function(args){
    var initial_lines = 0, end_lines = 0,filepath = ''
    if(args._[1]){
      filepath = process.cwd()+"/"+args._[1]
    }else{
      filepath = __dirname+'/index.js'
    }
    child.exec("wc -w "+filepath,function(err,out,stderr){
      initial_lines = out.split("/")[0]
    });
    var vim = child.spawn('vim',[filepath],{
      stdio:'inherit'
    })
    vim.on('close',function(code){
      // no output ?
      child.exec("wc -w "+filepath,function(err,out,stderr){
        end_lines = out.split("/")[0] 
        var color = Colors.FgGreen + "+ ";
        if(end_lines - initial_lines == 0){
          color = Colors.FgYellow
        }
        if(end_lines - initial_lines < 0){
          color = Colors.FgRed
        }
        console.log(`You have made ${color}${ end_lines - initial_lines }${Colors.Reset} changes !`)
        sayGoodBye() 
      });
    })
  },
  // todo task
  todo:function(args){
    var filepath = __dirname+'/../data/todo.json'
    var content = JSON.parse(fs.readFileSync(filepath))
    var todoLists = content.items
    if(exists(args.a)){
      if(args.a  && args.a !== true){
        var newTask = {}
        newTask.task = args.a
        newTask.status = "ongoing"
        todoLists.push(newTask)
        content.total = parseInt(content.total) + 1
      }else{
        console.log(`No task found!`)
        Tasks.help("todo")
      }
    }else if(exists(args.e)){
      if(args.e !== true && parseInt(args.e) == parseInt(args.e)){
        todoLists[args.e].task = args._[1]
      }else{
        console.log(`No task specified!`)
        Tasks.help("todo")
      }
    }else if(exists(args.d)){
      if(args.d !== true && parseInt(args.d) == parseInt(args.d)){
        todoLists[parseInt(args.d)].status = "done"
      }else{
        console.log(`No task specified!`)
        Tasks.help("todo")
      }
    }else if(exists(args.u)){
      if(args.u !== true && parseInt(args.u) == parseInt(args.u)){
        todoLists[args.u].status = "ongoing"
      }else{
        console.log(`no task specified!`)
        Tasks.help("todo")
      }
    }else if(exists(args.clear)){
      content.items = []
      content.total = 0 
    }else if(exists(args.r)){
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
          console.log(`${Colors.FgGreen}${i}  \u2713 ${v.status}      ${v.task}${Colors.Reset}`)
        }else if(v.status == "ongoing"){
          console.log(`${Colors.FgRed}${i}    ${v.status}   ${v.task}${Colors.Reset}`)
        }else if(v.status == "obsolete"){
          console.log(`${Colors.FgYellow}${i}    ${v.status}    ${v.task}${Colors.Reset}`)
        }
      })
    }
    fs.writeFileSync(filepath,JSON.stringify(content))
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
  // connect ssh
  ssh:function(args){
    var presetaddresses = {
      weirss : ["root@weirss.me"]
      ,gary : ["gary@zzgary.info","-p","2120"]
      ,aws : ["-i",process.env.home+"/temp/taoalpha.pem","ubuntu@52.32.254.98"]
      ,groupfinder : ["-i",process.env.home+"/temp/aws.pem","ubuntu@52.26.51.6"]
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
        var fixLenghtItem = (v + (new Array(50)).join(" ")).slice(0,30)
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
  oj:function(args){
    child.exec('open https://leetcode.com/problemset/algorithms/', function(err, stdout, stderr) {
      sayGoodBye()
    })
  },
  help:function(args){
    var helpDoc = {
      usage:{
        edit:"baby edit <path-to-file> ...",
        sleep:"baby sleep [-t | --time]",
        ssh:"baby ssh <address> [-n | --name]",
        praise:"baby praise",
        read:"baby read",
        todo:"baby todo [ -a -d -e ] ...",
        help:"baby help <command>",
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
  var adj = ["awesome","fantastic","wonderful","fabulous","outstanding","legendary"]
  console.log(`${Colors[pickRandomProperty(Colors)]}Tao, You are truly ${adj[Math.floor(Math.random()*adj.length)]}!${Colors.Reset}`)  
}


// Colors 
var Colors = {
Reset : "\x1b[0m"
,FgBlack : "\x1b[30m"
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
//,BgWhite : "\x1b[47m"
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
  console.log(`${Colors.FgGreen}Happy ${action}, Tao !${Colors.Reset}`)
}

// check whether variable or property exist or not
function exists(val){
  return typeof val !== "undefined"
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

if(userArgs._[0]){
  if(Tasks.hasOwnProperty(userArgs._[0])){
    Tasks[userArgs._[0]](userArgs)
  }else if(shortName.hasOwnProperty(userArgs._[0])){
    Tasks[shortName[userArgs._[0]]](userArgs)
  }else{
    Tasks["help"](userArgs)
  }
}else{
  Tasks["help"](userArgs)
}
