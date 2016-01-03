export function TodoDirective() {
  'ngInject';

  let directive = {
    restrict: 'E',
    scope: {
        collapse : '='
    },
    replace: true,
    templateUrl: 'template/todo.html',
    link: linkFunc,
    controller: TodoController,
    controllerAs: 'tm'
  };

  return directive;

  function linkFunc(scope, el) {
    el.addClass('todo');
  }
}

class TodoController {
  constructor ($scope,$log,$http,moment,mySocket) {
    'ngInject';

    this.$log = $log
    this.$http = $http
    this.collapse = false
    this.showTodoData = {}
    this.originTodoData = {data:{}}
    this.gotData = false
    this.moment = moment
    this.$scope = $scope
    // initial data
    this.mySocket = mySocket
    this.readFromDisk()
    var _this = this
    this.$scope.$on('outer', function() {
      _this.$log.info("Outer Render Finished at:"+moment().second())
    })
    //this.$scope.$on('inner', function() {
    //  _this.$log.info("Inner Render Finished at:"+moment().format())
    //})
  }
  toggleCollapse(){
    this.collapse = !this.collapse
  }
  addTodo(todo){
    if(this.collapse){
      this.toggleCollapse()
      return
    }
    var date = this.moment(new Date()).format('YYYY-MM-DD')
    this.originTodoData.data[date] = this.originTodoData.data[date] || {}
    this.originTodoData.data[date].doneItems = this.originTodoData.data[date].doneItems || 0
    this.originTodoData.data[date].items = this.originTodoData.data[date].items || []
    var singleData = {}
    singleData.content = todo.content
    singleData.status = "ongoing"
    singleData.done = false
    singleData.addTime = this.moment().format()
    this.originTodoData.data[date].items.unshift(singleData)
    this.formatData("changes")
  }
  deleteTodo(pid,id){
    // status indicates whether it is a done item or undone item
    if(this.originTodoData.data[pid].items[id].done){
      this.originTodoData.data[pid].doneItems += -1
      this.originTodoData.doneItems += -1
    }
    this.originTodoData.data[pid].items.splice(id,1)
    this.originTodoData.data[pid].items.length != 0 || delete this.originTodoData.data[pid]
    this.formatData("changes")
  }
  clear(){
    // empty storage
    this.originTodoData.data = {}
    this.formatData("changes")
  }
  formatData(flag){
    this.$log.info("formatting data"+moment().second())
    var _this = this
    Object.keys(this.originTodoData).forEach( (key) =>{
      key != "data" ? _this.showTodoData[key] = _this.originTodoData[key] : _this.showTodoData[key] = {}
    })
    Object.keys(this.originTodoData.data).sort(function(a, b){return a<=b}).forEach( (key) =>{
      _this.showTodoData.data[key] = _this.originTodoData.data[key]
    })
    this.$log.info("should be able to see the data..."+this.moment().second())
    if(flag=="changes"){
      this.flushToDisk()
    }else{
      // for the first loading data
      // hide all dayItems initial
      for(var item in _this.showTodoData.data){
        _this.showTodoData.data[item].expandItem = false
      }
      // only open the first one
      _this.showTodoData.data[Object.keys(_this.showTodoData.data)[0]].expandItem = true
    }
    this.$scope.$digest()
  }
  flushToDisk(){
    // save into disk
    if(this.mySocket.connected){
      this.mySocket.emit("writeTodo",JSON.parse(angular.toJson(this.showTodoData)))
    }else{
      this.$log.info("No connections!!")
    }
  }
  readFromDisk(){
    // read from the disk or from the socket io
    this.mySocket.emit("giveMeTodoData")
    var _this = this
    this.mySocket.on("connect_error",() => {
      _this.$log.info("Disconnected with the server, Your changes won't be saved")
      _this.mySocket.disconnect()
      return this.getTodoListFromApi('./todo.json').then((data) => {
        _this.originTodoData = data
        _this.formatData()
      });
    })
    this.$log.info("getting data..."+this.moment().second())
    this.mySocket.on('todoData', (data) => {
      _this.$log.info("got data..."+this.moment().second())
      _this.gotData = true
      _this.originTodoData = data
      _this.formatData()
    });
  }
  getTodoListFromApi(api) {
    return this.$http.get(api)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        this.$log.error('XHR Failed for datas.\n' + angular.toJson(error.data, true));
      });
  }
  toggleDone(pid,id){
    // mark the item as done
    this.originTodoData.data[pid].items[id].done = !this.originTodoData.data[pid].items[id].done
    this.originTodoData.data[pid].items[id].status = this.originTodoData.data[pid].items[id].done == true ? "done":"ongoing"
    this.originTodoData.data[pid].doneItems += this.originTodoData.data[pid].items[id].done ? 1 : -1
    this.originTodoData.doneItems += this.originTodoData.data[pid].items[id].done ? 1 : -1
    this.formatData("changes")
  }
}
