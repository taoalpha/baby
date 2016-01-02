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
  constructor ($log, todoList,$filter,moment,mySocket) {
    'ngInject';

    this.$log = $log
    this.$filter = $filter
    this.collapse = false
    this.todoData = {}
    this.moment = moment
    // initial data
    this.mySocket = mySocket
    this.readFromDisk(todoList)
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
    this.todoData.data[date] = this.todoData.data[date] || {}
    this.todoData.data[date].doneItems = this.todoData.data[date].doneItems || 0
    this.todoData.data[date].items = this.todoData.data[date].items || []
    var singleData = {}
    singleData.content = todo.content
    singleData.status = "ongoing"
    singleData.done = false
    singleData.date = this.moment().format()
    this.todoData.data[date].items.unshift(singleData)
    this.flushToDisk()
  }
  deleteTodo(pid,id){
    // status indicates whether it is a done item or undone item
    if(this.todoData.data[pid].items[id].done){
      this.todoData.data[pid].doneItems += -1
      this.todoData.doneItems += -1
    }
    this.todoData.data[pid].items.splice(id,1)
    this.todoData.data[pid].items.length != 0 || delete this.todoData.data[pid]
    this.flushToDisk()
  }
  clear(){
    // empty storage
    this.todoData.data = {}
  }
  flushToDisk(){
    // save into disk
    if(this.mySocket.connected){
      this.mySocket.emit("writeTodo",JSON.parse(angular.toJson(this.todoData)))
    }else{
      this.$log.info("No connections!!")
    }
  }
  readFromDisk(todoList){
    // read from the disk or from the socket io
    this.mySocket.emit("giveMeTodoData")
    var _this = this
    this.mySocket.on("connect_error",() => {
      _this.$log.info("Disconnected with the server, Your changes won't be saved")
      _this.mySocket.disconnect()
      return todoList.getTodoList(10).then((data) => {

        Object.keys(data).forEach( (key) =>{
          key != "data" ? _this.todoData[key] = data[key] : _this.todoData[key] = {}
        })
        Object.keys(data.data).sort(function(a, b){return a<=b}).forEach( (key) =>{
          _this.todoData.data[key] = data.data[key]
        })
        _this.todoData.data[Object.keys(_this.todoData.data)[0]].expandItem = true

        return _this.todoData;
      });
    })
    this.mySocket.on('todoData', (data) => {
      Object.keys(data).forEach( (key) =>{
        key != "data" ? _this.todoData[key] = data[key] : _this.todoData[key] = {}
      })
      Object.keys(data.data).sort(function(a, b){return a<=b}).forEach( (key) =>{
        _this.todoData.data[key] = data.data[key]
      })
      _this.todoData.data[Object.keys(_this.todoData.data)[0]].expandItem = true
    });
  }
  toggleDone(pid,id){
    // mark the item as done
    this.todoData.data[pid].items[id].done = !this.todoData.data[pid].items[id].done
    this.todoData.data[pid].items[id].status = this.todoData.data[pid].items[id].done == true ? "done":"ongoing"
    this.todoData.data[pid].doneItems += this.todoData.data[pid].items[id].done ? 1 : -1
    this.todoData.doneItems += this.todoData.data[pid].items[id].done ? 1 : -1
    this.flushToDisk()
  }
}
