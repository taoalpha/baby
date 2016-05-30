#! /usr/bin/env node
let parseArgs = require('minimist')
let readline = require('readline')
let path = require("path")
let url = require("url")
let fs = require("fs")
let Trie = require("./lib/trie")
let http = require('http')
let omelette = require("omelette");
let helper = require('./lib/helper')
let moment = require('moment');
let colors = require('colors');

/*
 * Baby class, entry file for all sub-modules
 * @class
 */

class Baby {
    /*
     * initialize some variables: CONFIG, userArgs, shortname map;
     */
    constructor() {
        this.userArgs = parseArgs(process.argv.slice(2));
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
        };
        this.loadConfig();
    }

    /*
     * load config file if it exists or 
     * generate the config file based on user input
     */
    loadConfig() {
        let configFilePath = path.join(__dirname,'./data/.config.json');
        if (helper.fileExists(configFilePath)) {
            this.userArgs.CONFIG = require(configFilePath);
            this.init();
        } else {
            console.log("Initialize with default configuration."+" You can edit with "+"'baby config'".green +" any time you want.");
            let questions = ["Your nickname(honey): ", "Enable the writing summary(Y): ", "Enable the idea collector(Y): ","Enable the todo collector(Y): ", "Enable the autoComplete(N): "],
                answers = {},
                cb = (ans) => {
                    answers = {
                        "nickname": ans[0],
                        "summary": (ans[1] == "" || ans[1].toLowerCase() == "y") ? true : false,
                        "idea": (ans[2] == "" || ans[2].toLowerCase() == "y") ? true : false,
                        "todo": (ans[3] == "" || ans[3].toLowerCase() == "y") ? true : false,
                        "autoComplete": (ans[4] == "" || ans[4].toLowerCase() == "n") ? false : true,
                        "dataPath": "./data"
                    }
                    helper.writeToFile(configFilePath, answers);
                    this.userArgs.CONFIG = answers;
                    if (answers['summary']) {
                        helper.writeToFile(path.join(answers.dataPath+"/.gSummary.json"),{
                            total: 0,
                            coding: {
                                addCount: 0,
                                delCount: 0,
                                days: {}
                            }
                        });
                    }
                    if (answers.todo) {
                        helper.writeToFile(path.join(answers.dataPath+"/.todo.json"),{
                            total: 0,
                            creationTime: moment().format(),
                            lastUpdated: moment().format(),
                            data: {},
                            oldData: {},
                            doneItems: 0
                        });
                    }
                    if (answers.idea) {
                        helper.writeToFile(path.join(answers.dataPath+"/.idea.json"),{
                            total: 0,
                            createdTime: moment().format(),
                            lastUpdated: moment().format(),
                            ideas: []
                        });
                    }
                    this.init();
                };
            helper.ask(questions,[],cb);
        }
    }

    /*
     * init the dispatcher with userArgs
     */
    init() {
        // never start with empty config
        if (!this.userArgs.CONFIG) {
            return;
        }
        let cmd = this.userArgs._[0];
        if (this.shortName.hasOwnProperty(cmd)) {
            this[this.shortName[cmd]](this.userArgs);
        } else if (this[cmd]) {
            this[cmd](this.userArgs);
        } else {
            this.help();
        }
    }

    /*
     * helper function for writing and deploying my blog
     */
    blog(args) {
        // blog new draft "name of the post" -c blog
        let scaffolds = process.env.HOME+"/github/blog/scaffolds/";
        let posts = process.env.HOME+"/github/blog/source/_posts/";
        if (helper.exists(args._[1])) {
            switch (args._[1]){
                case "new":
                    let tmplName = args._[3] ? args._[2]+".md" : "post.md",
                    title = args._[3] || args._[2];
                    if (!helper.fileExists(scaffolds+tmplName)) {
                        this.help("blog");
                    } else {
                        let tmpl = fs.readFileSync(scaffolds+tmplName,"utf-8"),
                            filepath = posts+moment().format().split("T")[0]+"-"+title.replace(/\s-/g,'').replace(/ /g,'-')+".md",
                            category = 'blog';
                        if (helper.exists(args.c)) {
                            category = args.c;
                            filepath = posts+args.c+"/"+title.toLowerCase().replace(/\s-/g,'').replace(/ /g,'-')+".md";
                        }
                        tmpl = tmpl.replace(`{{ date }}`,moment().format().split(".")[0].replace("T"," "))
                            .replace("{{ cat }}",category)
                            .replace('{{ title }}',title)
                            helper.writeToFile(filepath,tmpl,"text");
                        console.log("Your post has created ans saved in:".green + `${filepath}`.red);
                        args._[1] = filepath;
                        this.edit();
                    }
                    break;
                case "dir":
                    let dir = "~/github/blog",
                    proc = require('child_process').spawn('pbcopy');
                    proc.stdin.write(dir);
                    proc.stdin.end();
                    break;
                default:
                    this.help("blog");
            }
        } else {
            this.help("blog");
        }
    }

    /*
     * search helper for searching cdnjs for specific libraries
     */
    cdn(args) {
        if(args._[1]){
            let cdnjs = require("./data/cdnjs.json"),
                trieData = require("./data/trie.json"),
                count = 0,
                tree = new Trie();
            tree.root = trieData.root;
            // build the trie tree at the first time
            //for(var item in cdnjs){
            //  tree.insert(item)
            //}
            //fs.writeFileSync("./data/trie.json",JSON.stringify(tree))
            let results = tree.autocomplete(args._[1]);
            if (!results) {
                console.log("No Matches Found!".yellow);
                return;
            }
            results.slice(0,10).map((v) => {
                let fixLenghtItem = helper.toLength(v,30);
                console.log(`${fixLenghtItem}${cdnjs[v]}`);
            })
        }else{
            this.help("cdn");
        }
    }

    /*
     * editor helper for recording editing history
     */
    edit(args) {
        let initial_lines = 0, end_lines = 0,filepath = '';
        if (args._[1]) {
            filepath = path.join.apply(path,helper.pathParser([process.cwd(),args._[1]]));
        } else {
            filepath = __dirname+'/index.js';
        }
        args.isDir = helper.fileExists(filepath,'dir');
        args.isFile = helper.fileExists(filepath);
        if (!args.isDir && !args.isFile) {
            console.log("Wrong input stream, expected a file or directory!".yellow);
            return;
        }
        // get the initial number of lines
        args.isDir || helper.exec("wc -l "+filepath,(out) => {initial_lines = out.split("/")[0]});
        let vim = helper.spawn('vim',[filepath]);
        vim.on('close',(code) => {
            args.isDir || helper.exec("wc -l "+filepath,
                    (out) => {
                        end_lines = out.split("/")[0];
                        let data = {};
                        args._[1] = 'coding';
                        data.addCount = end_lines - initial_lines;
                        let colorNumber = `+ ${data.addCount}`.green;
                        data.delCount = 0;
                        if (end_lines - initial_lines == 0) {
                            colorNumber = `0`.yellow;
                        }
                        if (end_lines - initial_lines < 0) {
                            data.delCount = initial_lines - end_lines;
                            data.addCount = 0;
                            colorNumber = `- ${data.delCount}`.red;
                        }
                        if (end_lines - initial_lines !== 0) {
                            data.isValid = true;
                            this.summary(args, data);
                        }
                        console.log(`You have made ${colorNumber} changes !`);
                        helper.sayGoodBye(args);
                    });
        })
    }

    /*
     * git helper for daily commits
     */
    git(args) {
        if (helper.exists(args._[1])) {
            let msg = args._[2] || "daily update";
            switch (args._[1]) {
                case "normal":
                    helper.execSync("git add .");
                    helper.execSync(`git commit -m'${msg}'`);
                    helper.execSync(`git push`);
                    break;
                default:
                    console.log("missing parameter");
            }
        }else{
            console.log("Please specify your action!");
        }
    }

    /*
     * idea collector
     */
    idea(args) {
        let filepath = path.join(__dirname, args.CONFIG.dataPath, '/.idea.json'),
        filestatus = helper.fileExists(filepath),
        showIdea = true;
        // deal with no file and open the server
        if (!filestatus) {
            let rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question("Will initialize the idea collection profile (Y/n) ? ", (answer) => {
                if(answer.toLowerCase() == "y"){
                    helper.writeToFile(filepath,{
                        total: 0,
                        createdTime: new Date(),
                        lastUpdated: new Date(),
                        ideas: []
                    });
                    helper.sayGoodBye(args);
                }
                rl.close();
            });
        } else {
            // add new idea
            let ideaData = require(filepath);
            if (helper.exists(args.a)) {
                showIdea = false;
                let questions = ["Describe your idea: ","Inspired by: ","Under which category(life,work,travel...): ","Tag you to label it: "] ;
                // loop to ask all these questions and save all answers 
                let callback = (ans) => {
                    // store the data to the file
                    let data = {}
                    data.desc = ans[0];
                    data.inspired = ans[1];
                    data.cat = ans[2];
                    data.tags = ans[3].split(",");
                    data.status = "backlog";
                    ideaData.ideas.push(data);
                    helper.writeToFile(filepath,ideaData);
                    showIdea = true;
                }
                helper.ask(questions,[],callback)
            }
            // mark the idea with done status
            if (helper.exists(args.d)) {
                if (args.d !== true && parseInt(args.d) == parseInt(args.d)) {
                    ideaData.ideas[args.d].status = "done";
                    helper.writeToFile(filepath,ideaData);
                } else {
                    this.help("idea")
                }
            }
            // edit current existing idea with all five questions
            if (helper.exists(args.e)) {
                if (args.e !== true && parseInt(args.e) == parseInt(args.e)) {
                    // initial the question with the answers
                    let tData = ideaData.ideas[args.e],
                    questions = [`Describe your idea(${tData.desc}): `,`Inspired by(${tData.inspired}): `,`Under which category(${tData.cat}): `,`Tag you to label it(${tData.tags.join(",")}): `,`Current status of this idea(${tData.status}): `],
                    // loop to ask all these questions and save all answers 
                    callback = (ans) => {
                        // store the data to the file
                        let data = ideaData.ideas[args.e]
                            data.desc = ans[0] || data.desc;
                        data.inspired = ans[1] || data.inspired;
                        data.cat = ans[2] || data.cat;
                        data.tags = ans[3] || ans[3].split(",") || data.tags;
                        data.status = ans[4] || data.status;
                        ideaData.ideas[args.e] = data;
                        helper.writeToFile(filepath,ideaData);
                        delete args.e;
                        this.idea();
                    };
                    helper.ask(questions,[],callback);
                    return
                } else {
                    this.help("idea");
                }
            }
            // remove current existing idea 
            if (helper.exists(args.r)) {
                if (args.r !== true && parseInt(args.r) == parseInt(args.r)) {
                    ideaData.ideas.splice(args.r,1);
                    helper.writeToFile(filepath,ideaData);
                }else{
                    this.help("idea");
                }
            }

            if (ideaData.ideas.length<1) {
                console.log("Now you have no tasks on list, add some ^_^ !");
            } else {
                if (showIdea) {
                    ideaData.ideas.map((v,i) => {
                        if(v.status =="done"){
                            console.log(`${helper.Colors.FgGreen}${helper.toLength(i,3)}\u2713 ${helper.toLength(v.status,10)}${v.desc}${helper.Colors.Reset}`);
                        }else if(v.status == "ongoing"){
                            console.log(`${helper.Colors.FgGreen}${helper.toLength(i,3)} ${helper.toLength(v.status,10)}${v.desc}${helper.Colors.Reset}`);
                        }else{
                            console.log(`${helper.Colors.FgGreen}${helper.toLength(i,3)} ${helper.toLength(v.status,10)}${v.desc}${helper.Colors.Reset}`);
                        }
                    })
                }
            }
        } 
    }

    /*
     * npm helper
     */
    npm(args) {
        if (helper.exists(args._[1]) && args._[1] == "update") {
            let packages = helper.execSync('npm outdated').toString();
            packages = packages.split(/\n/).slice(1,packages.length);
            packages.pop();
            let temp = {};
            packages.map((v) => {
                let re = /[a-zA-Z0-9-_\.]+\s*?/g,
                result = v.match(re);
                temp[result[0]] = {};
                temp[result[0]].current = result[1];
                temp[result[0]].wanted = result[2];
                temp[result[0]].latest = result[3];
            })
            packages = temp;
            //delete temp
            if (args.latest) {
                helper.npmhelper(packages);
            } else {
                helper.npmhelper(packages,'wanted');
            }
        }
    }

    /*
     * oj helper
     */
    oj(args) {
        helper.exec('open https://leetcode.com/problemset/algorithms/', (out) => { helper.sayGoodBye(args); })
    }

    /*
     * positive words
     */
    praise(args){
        let stdin = process.stdin;
        stdin.setRawMode( true );
        //stdin.resume();
        stdin.setEncoding( 'utf8' );
        stdin.on( 'data', ( key ) => {
            if (key === 'c' || key == '\u0003') {
                process.exit();
            }
        });
        setInterval(helper.praiseMe,2000)
    }

    /*
     * open a book from my reading list
     */
    read(args){
        let filepath = '',
        book_dir = process.env.HOME+"/readings",
        books = fs.readdir(book_dir, (err,list) => {
            if (err) return err;
            let rightPrefix = false;
            filepath = [book_dir + "/" + list[Math.floor(Math.random()*list.length)]];
            if (!helper.exists(args._[1])) {
                rightPrefix = true;
            }
            let count = 0;
            while (!rightPrefix && count < 300) {
                let fName = list[Math.floor(Math.random()*list.length)];
                if (fName.toLowerCase().indexOf(args._[1].toLowerCase()) > -1) {
                    rightPrefix = true;
                    filepath = [book_dir + "/" + fName];
                }
                count ++;
            }
            if (!rightPrefix) {
                console.log(`${helper.Colors.FgGreen} No match book found ! ${helper.Colors.Reset}`);
            } else {
                let book = helper.spawn('open',filepath);
                book.on('close',(code) => {
                    args.action = "reading";
                    helper.sayGoodBye(args);
                })
            }
        })
    }

    /*
     * rss reader
     */
    rss(args) {
        // will use the request and cheerio to get and parse the html, maybe need phantomjs to help me deal with some dynamic stuff
    }

    /*
     * create a http server with specific directory
     */
    serve(args){
        let pathname = path.join(__dirname,'./lib/babyUI/dist/');
        if (helper.exists(args._[1])) {
            pathname = path.join.apply(helper.pathParser([process.cwd(),args._[1]]));
        }
        // check the os first before opening the browser
        helper.exec('open http://localhost:8000/');
        let handler = (request, response) => {

            let uri = url.parse(request.url).pathname,
            filename = path.join(pathname, uri),
            dirstatus = helper.fileExists(filename,'dir'),
            filestatus = helper.fileExists(filename);

            if (!dirstatus && !filestatus) {
                if (filename.endsWith('css')) {
                    response.writeHead(404, {"Content-Type": "text/css"});
                } else {
                    response.writeHead(404, {"Content-Type": "text/plain"});
                }
                response.write("404 Not Found\n");
                response.end();
                return;
            }

            if (fs.statSync(filename).isDirectory()) filename += '/index.html';

            fs.readFile(filename, (err, file) => {
                if (err) {
                    response.writeHead(500, {"Content-Type": "text/plain"});
                    response.write(err + "\n");
                    response.end();
                    return;
                }

                if (filename.endsWith('css')) {
                    response.writeHead(200,{"Content-Type": "text/css"});
                } else {
                    response.writeHead(200);
                }
                response.end(file);
            });
        }
        let app = http.createServer(handler),
        io = require('socket.io')(app);
        app.listen(8000);

        io.on('connection', (socket) => {
            socket.on('exit', (data) => {
                //Tasks.todo(data)
                helper.sayGoodBye(args)
            });
            let socketHandler = require('./lib/socketHandler');
            socketHandler.rss(socket);
            socketHandler.todo(socket);
            socketHandler.widget(socket);
            socketHandler.tool(socket);
        });

        console.log("Static file server running at\n  => http://localhost:8000/\nCTRL + C to shutdown");
    }

    /*
     * sleep helper
     */
    sleep(args) {
        let delay = args._[1] || args["t"] || args["time"] || 2;
        console.log("will sleep after "+delay+" seconds, happy rest!");
        setTimeout(() => {
            // helper.exec('system_profiler SPUSBDataType | grep TaoAlpha',helper.exec('pmset displaysleepnow'))
            helper.exec('pmset displaysleepnow')
        }, delay*1000)
    }

    /*
     * ssh helper
     */
    ssh(args) {
        let presetaddresses = {
            weirss : ["root@weirss.me"],
            pi: ["pi@104.229.171.106"],
            gary : ["gary@zzgary.info","-p","2120"],
            juan : ["root@www.51juanzeng.com"],
            aws : ["-i",process.env.HOME+"/temp/taoalpha.pem","ubuntu@52.32.254.98"],
            groupfinder : ["-i",process.env.HOME+"/temp/aws.pem","ubuntu@52.26.51.6"]
        },
        address = "";
        if (args._[1]) {
            address = [args._[1]];
        } else if(args.n) {
            address = presetaddresses[args.n];
        }
        let ssh = helper.spawn('ssh',address);
        ssh.on('close',(code) => {
            helper.sayGoodBye(args)
        })
    }

    /*
     * summary recorder
     */
    summary(args, data) {
        // need a config file
        let filepath = path.join(__dirname,args.CONFIG.dataPath,'/.gSummary.json'),
        filestatus = helper.fileExists(filepath);
        if (!filestatus) {
            let rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question("Will initialize the summary report (Y/n) ? ", (answer) => {
                if(answer.toLowerCase() == "y"){
                    helper.writeToFile(filepath,{
                        total: 0,
                        coding: {
                            addCount: 0,
                            delCount: 0,
                            days: {}
                        }
                    });
                    helper.sayGoodBye(args);
                }
                rl.close();
                if (data && data.isValid) {
                    this.summary(args, data);
                }
            });
        } else {
            let summaryReport = require(filepath),
                today = new Date().toLocaleDateString(),
                // clean the log and keep records up to 30 days || config.LOGDAYS
                logdays = args.CONFIG.logdays || 60;
            if (Object.keys(summaryReport.coding.days).length > logdays) {
                let prev = new Date((new Date()).setDate((new Date()).getDate()-logdays)).toLocaleDateString();
                for (var i in summaryReport.coding.days) {
                    if (new Date(i)<new Date(prev)) {
                        delete summaryReport.coding.days[i];
                    }
                }
            }
            if (!summaryReport.coding.days[today]) {
                summaryReport.coding.days[today] = {};
                summaryReport.coding.days[today].addCount = 0;
                summaryReport.coding.days[today].delCount = 0;
            }
            // show or write the records to the data
            if (args._[1] == "coding" && data) {
                if (!summaryReport.coding.days[today]) {
                    summaryReport.coding.days[today] = {};
                    summaryReport.coding.days[today].addCount = data.addCount;
                    summaryReport.coding.days[today].delCount = data.delCount;
                }
                summaryReport.coding.addCount += data.addCount;
                summaryReport.coding.delCount += data.delCount;
                summaryReport.coding.days[today].addCount += data.addCount;
                summaryReport.coding.days[today].delCount += data.delCount;
                helper.writeToFile(filepath,summaryReport);
            } else {
                console.log('You have made ' + `+ ${summaryReport.coding.addCount}`.green + ' insertions and ' + `- ${summaryReport.coding.delCount}`.red + ' deletions!');
                console.log('Special for today:'.yellow + ' you have made ' + `+ ${summaryReport.coding.days[today].addCount}`.green + ' insertions and ' + `- ${summaryReport.coding.days[today].delCount}`.red + ' deletions!');
            }
        }
    }

    /*
     * todo list
     */
    todo(args) {
        let filepath = path.join(__dirname, args.CONFIG.dataPath, '/.todo.json'),
        filestatus = helper.fileExists(filepath);
        // deal with no file and open the server
        if (!filestatus) {
            let rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question("Will initialize the task profile (Y/n) ? ", (answer) => {
                if(answer.toLowerCase() == "y"){
                    helper.writeToFile(filepath,{
                        total: 0,
                        creationTime: moment().format(),
                        lastUpdated: moment().format(),
                        data: {},
                        oldData: {},
                        doneItems: 0
                    });
                    helper.sayGoodBye(args);
                }
                rl.close();
            });
        } else {
            let content = require(filepath),
                // build several mappers
                allMapper = [];
            for(let dayItem in content.data){
                content.data[dayItem].items.map(function(v) {
                    let singleItem = {};
                    singleItem.parent = content.data[dayItem];
                    singleItem.pointer = v;
                    singleItem.content = v.content;
                    singleItem.status = v.status;
                    singleItem.done = v.done;
                    allMapper.push(singleItem);
                })
            }
            // mapper is used to access item with index so that we can mark it as done or undone
            let showList = () => {
                if (content.total<1) {
                    console.log("Now you have no tasks on list, add some ^_^ !");
                } else {
                    let allMapper = [];
                    for (let dayItem in content.data) {
                        content.data[dayItem].items.map(function(v){
                            let singleItem = {};
                            singleItem.content = v.content;
                            singleItem.status = v.status;
                            singleItem.done = v.done;
                            allMapper.push(singleItem);
                        })
                    }
                    allMapper.map((v,i) => {
                        if(v.status == "done"){
                            console.log(`${helper.toLength(i,3)}\u2713 ${helper.toLength(v.status,10)}${v.content}`.green);
                        }else if(v.status == "ongoing"){
                            console.log(`${helper.toLength(i,5)}${helper.toLength(v.status,10)}${v.content}`.red);
                        }else if(v.status == "obsolete"){
                            console.log(`${helper.toLength(i,5)}${helper.toLength(v.status,10)}${v.content}`.yellow);
                        }
                    })
                }
                content.lastUpdated = moment().format();
                helper.writeToFile(filepath,content);
            }
            // special for json api
            if (args.json) {
                return filepath;
            }
            // special for only `bb t`
            if (Object.keys(args).length == 2) {
                showList();
                return;
            }
            if (helper.exists(args.a)) {
                if (args.a  && args.a !== true) {
                    let newItem = {};
                    newItem.content= args.a;
                    newItem.status = "ongoing";
                    newItem.done = false;
                    newItem.addTime = moment().format();
                    let dateID = newItem.addTime.split("T")[0];
                    content.data[dateID] = content.data[dateID] || {};
                    content.data[dateID].doneItems = content.data[dateID].doneItems || 0;
                    content.data[dateID].addTime = content.data[dateID].addTime || moment().format();
                    content.data[dateID].items = content.data[dateID].items || [];
                    content.data[dateID].items.unshift(newItem);
                    content.total += 1;
                    showList();
                } else {
                    console.log(`No item found!`);
                    this.help("todo");
                }
            }
            if (helper.exists(args.e)) {
                if (args.e !== true && parseInt(args.e) == parseInt(args.e)) {
                    allMapper[args.e].pointer.content = args._[1];
                    showList();
                } else {
                    console.log(`No task specified!`);
                    this.help("todo");
                }
            }
            if (helper.exists(args.d)) {
                if (args.d !== true && parseInt(args.d) == parseInt(args.d)) {
                    allMapper[parseInt(args.d)].pointer.status = "done";
                    allMapper[parseInt(args.d)].pointer.done = true;
                    allMapper[parseInt(args.d)].pointer.doneTime = moment().format();
                    allMapper[parseInt(args.d)].parent.doneItems += 1;
                    content.doneItems += 1;
                    showList();
                } else {
                    if (Object.keys(content.data).length<1) {
                        console.log("Now you have no tasks on list, add some ^_^ !");
                    } else {
                        // show all items that marked as done - how good you are!!
                        let doneMapper = [];
                        allMapper.map((v,i) =>{
                            if (v.done) {
                                doneMapper.push(v);
                            }
                        })
                        doneMapper.map((v,i) => {
                            console.log(`${helper.toLength(i,3)}\u2713 ${helper.toLength(v.status,10)}${v.content}`.green);
                        })
                    }
                    this.help("todo");
                    return;
                }
            }
            if (helper.exists(args.u)) {
                if (args.u !== true && parseInt(args.u) == parseInt(args.u)) {
                    allMapper[args.u].pointer.status = "ongoing";
                    allMapper[parseInt(args.u)].pointer.doneTime = '';
                    allMapper[parseInt(args.u)].pointer.done = false;
                    allMapper[parseInt(args.u)].parent.doneItems += -1;
                    content.doneItems += -1;
                    showList();
                } else {
                    console.log(`no task specified!`);
                    this.help("todo");
                }
            }
            if (helper.exists(args.clean)) {
                // clean all task to oldData
                for (let dayItem in content.data) {
                    content.oldData[dayItem] = content.data[dayItem];
                }
                content.data = {};
                content.total = 0;
                content.doneItems = 0;
                showList();
            }
            if (helper.exists(args.clear)) {
                content.data = {};
                content.oldData = {};
                content.total = 0;
                showList();
            }
            if (helper.exists(args.r)) {
                if (args.r !== true && parseInt(args.r) == parseInt(args.r)) {
                    // should delete the item
                }
                // content.total = parseInt(content.total) - 1
            } 
        }
    }

    /*
     * tools
     */
    tool(args) {
        switch (args._[1]){
            case "pf":
                // print the file structure of current working directory
                helper.printFiles(process.cwd());
                break;
            case "rp":
                // find repeated part of your code with similarity of string
                helper.calculateRepeat(args._[2]);
                break;
            default:
                this.help("todo");
        }
    }

    /*
     * output the help message.
     */
    help(){
        let args = this.userArgs;
        let helpDoc = {
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
        console.log("Welcome to baby ! ^_^");
        if (typeof args === "string") {
            console.log(helpDoc.usage[args])
        } else if (args._[1] && helpDoc.usage.hasOwnProperty(args._[1])) {
            console.log(helpDoc.usage[args._[1]]);
        } else {
            console.log("Usage:");
            for(var item in helpDoc.usage){
                console.log("  "+helpDoc.usage[item]);
            }
            console.log("\nOptions:");
            for(item in helpDoc.option){
                console.log("  "+helpDoc.option[item]);
            }
        }
    }
}
module.exports = Baby
