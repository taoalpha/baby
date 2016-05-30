#! /usr/bin/env node
let fs = require("fs"),
    path = require("path"),
    child_process = require('child_process'),
    readline = require('readline');

let Helper = {
    // ask for questions
    ask : (q,a,callback) => {
        if(q.length==0){
            callback(a);
            return
        }
        let rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        let qt = q.shift();
        rl.question(qt, function(answer) {
            a.push(answer);
            rl.close();
            Helper.ask(q,a,callback)
        });
    },
    // check whether variable or property exist or not
    exists : (val) => {
        return typeof val !== "undefined"
    },
    // exec some commands that pass in
    exec : (command,callback) => {
        child_process.exec(command,function(error,stdout,stderr){
            if (stderr) console.log('exec error: ' + error);
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
        let adj = ["awesome","fantastic","wonderful","fabulous","outstanding","legendary","great","briliant","talented","amazing"];
        console.log(`Tao, You are truly ${adj[Math.floor(Math.random()*adj.length)]}!`.random);
    },
    // print files under a specific path
    printFiles : (pathname,st) => {
        let step = st || 1,
        fileList = fs.readdirSync(pathname);
        if (!fileList.length) {
            console.log(Helper.toLength('----------------------------',step*3)+"no files");
            return;
        }
        for (let v in fileList) {
            console.log(Helper.toLength('----------------------------',step*3)+fileList[v]);
            let newpath = path.join(pathname,fileList[v]);
            if(Helper.fileExists(newpath,'dir')){
                Helper.printFiles(newpath,step+1)
            }
        }
    },
    // pick a random property of an object
    pickRandomProperty : (obj) => {
        let result,
        count = 0;
        for (let prop in obj) {
            if (Math.random() < 1/++count) {
                result = prop;
            }
        }
        return result;
    },
    // say good bye
    sayGoodBye : (args) => {
        let action = args ? args.action ? args.action:"coding" : "coding";
        console.log(`Happy ${action}, ${args ? args.CONFIG.nickname: 'tao'} !`.green);
    },
    // spawn for child_process
    spawn : (action,command) => {
        return child_process.spawn(action,command, {
            stdio:'inherit'
        });
    },
    // Fix length for string
    toLength : (v,len) => {
        let val = v + "";
        return (val+(new Array(val.length*10)).join(" ")).slice(0,len);
    },
    // write data into file
    writeToFile : (filepath,data,type) => {
        if(type!=="text"){
            data = JSON.stringify(data);
        }
        fs.writeFileSync(filepath,data,"utf8")
    }
}

module.exports  = Helper
