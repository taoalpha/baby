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
  constructor ($log, todoList,$filter) {
    'ngInject';

    this.$log = $log;
    this.$filter = $filter;
    this.collapse = false;
    this.todoData = {}
    // initial data
    this.readFromDisk(todoList);
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
    return todoList.getTodoList(10).then((data) => {

      this.todoData = data;
      this.todoData.data[Object.keys(this.todoData.data)[0]].expandItem = true

      return this.todoData;
    });
  }
  toggleDone(pid,id){
    // mark the item as done
    this.todoData.data[pid].items[id].done = !this.todoData.data[pid].items[id].done
    this.todoData.data[pid].doneItems += this.todoData.data[pid].items[id].done ? 1 : -1
    this.todoData.doneItems += this.todoData.data[pid].items[id].done ? 1 : -1
  }
}
