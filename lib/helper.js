#! /usr/bin/env node
let fs = require("fs"),
    path = require("path"),
    child_process = require('child_process'),
    os = require("os"),
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
            if (error !== null) {
                console.log(`${stderr}`.red);
                return;
            }
            if(callback) callback(stdout)
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
            Helper.sayGoodBye();
            return
        }else{
            let item = Object.keys(packages)[0],
                version = "latest";
            if(flag == "wanted"){
                version = packages[item].wanted
            }
            console.log('Installing '+item);
            let single = child_process.spawn('npm',['install',item+'@'+version,'--save-dev'],{
                stdio:"inherit"
            })
            single.on('close',function(){
                delete packages[item];
                Helper.npmHelper(packages);
            })
        }
    },
    // path parser
    pathParser : (args) => {
        let oLen = args.length;
        for(let i = 0;i<oLen;i++){
            if(args[i][0] === '~' || args[i][0] === '/'){
                let cutLen = args.splice(0,i).length;
                oLen -= cutLen;
                i -= cutLen;
            }
        }
        return args
    },
    // print files under a specific path
    printFiles : (pathname, maxL, st) => {
        let step = st || 1,
        fileList = fs.readdirSync(pathname);
        if (step > maxL) return;
        if (!fileList.length) {
            console.log(Helper.toLength('----------------------------',step*3)+"no files");
            return;
        }
        for (let v in fileList) {
            console.log(Helper.toLength('----------------------------',step*3)+fileList[v]);
            let newpath = path.join(pathname,fileList[v]);
            if(Helper.fileExists(newpath,'dir')){
                Helper.printFiles(newpath,maxL, step+1)
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
