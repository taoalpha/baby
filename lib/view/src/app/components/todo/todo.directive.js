export function TodoDirective() {
  'ngInject';

  let directive = {
    restrict: 'E',
    scope: {
        collapse : '='
    },
    replace: true,
    templateUrl: 'app/components/todo/todo.html',
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
  constructor ($log, todoList,$filter,mySocket) {
    'ngInject';

    this.$log = $log;
    this.mySocket = mySocket;
    this.$filter = $filter;
    this.collapse = false;
    this.todoData = {}
    // initial data
    this.readFromDisk(todoList);
    this.mySocket.emit("bye",{"data":"fuck you ! I make it"})
  }
  toggleCollapse(){
    this.collapse = !this.collapse
  }
  addTodo(todo){
    if(this.collapse){
      this.toggleCollapse()
      return
    }
    this.$log.info(todo)
    var date = this.$filter('date')(new Date(),'y-M-d')
    this.todoData.data[date] = this.todoData.data[date] || {}
    this.todoData.data[date].doneItems = this.todoData.data[date].doneItems || 0
    this.todoData.data[date].items = this.todoData.data[date].items || []
    var singleData = {}
    singleData.content = todo.content
    singleData.status = "active"
    singleData.done = false
    singleData.date = this.$filter('date')(new Date(),'yyyy-MM-ddTHH:mm:ss.sssZ')
    this.todoData.data[date].items.push(singleData)
  }
  deleteTodo(pid,id){
    // status indicates whether it is a done item or undone item
    if(this.todoData.data[pid].items[id].done){
      this.todoData.data[pid].doneItems += -1
      this.todoData.doneItems += -1
    }
    this.todoData.data[pid].items.splice(id,1)
    this.todoData.data[pid].items.length != 0 || delete this.todoData.data[pid]
  }
  clear(){
    // empty storage
    this.todoData.data = {}
  }
  flushToDisk(){
    // save into disk

  }
  readFromDisk(todoList){
    // read from the disk or from the socket io
    var _this = this
    this.mySocket.on("connect_error",() => {
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
    this.todoData.data[pid].doneItems += this.todoData.data[pid].items[id].done ? 1 : -1
    this.todoData.doneItems += this.todoData.data[pid].items[id].done ? 1 : -1
  }
}
