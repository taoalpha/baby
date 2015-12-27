#! /usr/bin/env node
var fs = require("fs")
var path = require("path")
var child_process = require('child_process')

var Helper = {
  // ask for questions
  ask : (q,a,callback) => {
    if(q.length==0){
      callback(a)
      return
    }
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    var qt = q.shift()
    rl.question(qt, function(answer) {
      a.push(answer)
      rl.close();
      Helper.ask(q,a,callback)
    });
  },
  // colors need to use
  Colors : {
    Reset : "\x1b[0m",FgRed : "\x1b[31m",FgGreen : "\x1b[32m",FgYellow : "\x1b[33m",FgBlue : "\x1b[34m",FgMagenta : "\x1b[35m",FgCyan : "\x1b[36m",FgWhite : "\x1b[37m",BgBlack : "\x1b[40m",BgRed : "\x1b[41m",BgGreen : "\x1b[42m",BgYellow : "\x1b[43m",BgBlue : "\x1b[44m",BgMagenta : "\x1b[45m",BgCyan : "\x1b[46m"
  },
  // check whether variable or property exist or not
  exists : (val) => {
    return typeof val !== "undefined"
  },
  // exec some commands that pass in
  exec : (command,callback) => {
    child_process.exec(command,function(error,stdout,stderr){
      if(stderr) console.log('exec error: ' + error)
      if(error == null){
        if(callback) callback(stdout)
      }else{
        console.log('exec error: ' + error);
      }
    })
  },
  // execSync
  execSync : (command) => {
    return child_process.execSync(command)
  },
  // check whether file or directory exists or not
  fileExists : (filePath,type) => {
    if(type=="dir"){
      try{
        return fs.statSync(filePath).isDirectory();
      }catch (err){
        return false;
      }
    }else{
      try{
        return fs.statSync(filePath).isFile();
      }catch (err){
        return false;
      }
    }
  },
  // helper for npm
  npmHelper : (packages,flag) => {
    if(Object.keys(packages).length == 0){
      Helper.sayGoodBye()
      return
    }else{
      var item = Object.keys(packages)[0]
      var version = "latest"
      if(flag == "wanted"){
        version = packages[item].wanted
      }
      console.log('Installing '+item)
      var single = child_process.spawn('npm',['install',item+'@'+version,'--save-dev'],{
        stdio:"inherit"
      })
      single.on('close',function(){
        delete packages[item]
        Helper.npmHelper(packages)
      })
    }
  },
  // path parser
  pathParser : (args) => {
    var oLen = args.length
    for(var i = 0;i<oLen;i++){
      if(args[i][0] === '~' || args[i][0] === '/'){
        var cutLen = args.splice(0,i).length
        oLen -= cutLen
        i -= cutLen
      }
    }
    return args
  },
  // praise me...
  praiseMe : () => {
    var adj = ["awesome","fantastic","wonderful","fabulous","outstanding","legendary","great","briliant","talented","amazing"]
    console.log(`${Helper.Colors[Helper.pickRandomProperty(Helper.Colors)]}Tao, You are truly ${adj[Math.floor(Math.random()*adj.length)]}!${Helper.Colors.Reset}`)
  },
  // print files under a specific path
  printFiles : (pathname,step) => {
    var step = step || 1
    //console.log(Helper.toLength('====================',step*2)+pathname)
    var fileList = fs.readdirSync(pathname)
    //,function(err,list){
    if(!fileList.length) {console.log(Helper.toLength('----------------------------',step*3)+"no files");return}
    for(var v in fileList){
      //if(v == 5){
      //  console.log(Helper.toLength('----------------------------',step*3)+(fileList.length - v)+" More files not show here")
      //}else if(v<5){
      console.log(Helper.toLength('----------------------------',step*3)+fileList[v])
      //}
      var newpath = path.join(pathname,fileList[v])
      if(Helper.fileExists(newpath,'dir')){
        Helper.printFiles(newpath,step+1)
      }
    }
  },
  // pick a random property of an object
  pickRandomProperty : (obj) => {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1/++count)
           result = prop;
    return result;
  },
  // say good bye
  sayGoodBye : (args) => {
    var action = args ? args.action ? args.action:"coding" : "coding"
    console.log(`${Helper.Colors.FgGreen}Happy ${action}, ${args ? args.CONFIG.username : 'tao'} !${Helper.Colors.Reset}`)
  },
  // spawn for child_process
  spawn : (action,command) => {
    return child_process.spawn(action,command,{
      stdio:'inherit'
    });
  },
  // Fix length for string
  toLength : (val,len) => {
    var val = val+""
    return (val+(new Array(val.length*10)).join(" ")).slice(0,len)
  },
  // write data into file
  writeToFile : (filepath,data,type) => {
    if(type!=="text"){
      data = JSON.stringify(data)
    }
    fs.writeFileSync(filepath,data,"utf8")
  }
}

module.exports  = Helper
