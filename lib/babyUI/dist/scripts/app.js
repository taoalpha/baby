(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TodoDirective = TodoDirective;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function TodoDirective() {
  'ngInject';

  var directive = {
    restrict: 'E',
    scope: {
      collapse: '='
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

var TodoController = (function () {
  function TodoController($log, todoList, $filter, moment, mySocket) {
    'ngInject';

    _classCallCheck(this, TodoController);

    this.$log = $log;
    this.$filter = $filter;
    this.collapse = false;
    this.todoData = {};
    this.moment = moment;
    // initial data
    this.mySocket = mySocket;
    this.readFromDisk(todoList);
  }

  _createClass(TodoController, [{
    key: 'toggleCollapse',
    value: function toggleCollapse() {
      this.collapse = !this.collapse;
    }
  }, {
    key: 'addTodo',
    value: function addTodo(todo) {
      if (this.collapse) {
        this.toggleCollapse();
        return;
      }
      var date = this.moment(new Date()).format('YYYY-MM-DD');
      this.todoData.data[date] = this.todoData.data[date] || {};
      this.todoData.data[date].doneItems = this.todoData.data[date].doneItems || 0;
      this.todoData.data[date].items = this.todoData.data[date].items || [];
      var singleData = {};
      singleData.content = todo.content;
      singleData.status = "ongoing";
      singleData.done = false;
      singleData.date = this.moment().format();
      this.todoData.data[date].items.unshift(singleData);
      this.flushToDisk();
    }
  }, {
    key: 'deleteTodo',
    value: function deleteTodo(pid, id) {
      // status indicates whether it is a done item or undone item
      if (this.todoData.data[pid].items[id].done) {
        this.todoData.data[pid].doneItems += -1;
        this.todoData.doneItems += -1;
      }
      this.todoData.data[pid].items.splice(id, 1);
      this.todoData.data[pid].items.length != 0 || delete this.todoData.data[pid];
      this.flushToDisk();
    }
  }, {
    key: 'clear',
    value: function clear() {
      // empty storage
      this.todoData.data = {};
    }
  }, {
    key: 'flushToDisk',
    value: function flushToDisk() {
      // save into disk
      if (this.mySocket.connected) {
        this.mySocket.emit("writeTodo", this.todoData);
      } else {
        this.$log.info("No connections!!");
      }
    }
  }, {
    key: 'readFromDisk',
    value: function readFromDisk(todoList) {
      // read from the disk or from the socket io
      this.mySocket.emit("giveMeTodoData");
      var _this = this;
      this.mySocket.on("connect_error", function () {
        _this.$log.info("Disconnected with the server, Your changes won't be saved");
        _this.mySocket.disconnect();
        return todoList.getTodoList(10).then(function (data) {

          Object.keys(data).forEach(function (key) {
            key != "data" ? _this.todoData[key] = data[key] : _this.todoData[key] = {};
          });
          Object.keys(data.data).sort(function (a, b) {
            return a <= b;
          }).forEach(function (key) {
            _this.todoData.data[key] = data.data[key];
          });
          _this.todoData.data[Object.keys(_this.todoData.data)[0]].expandItem = true;

          return _this.todoData;
        });
      });
      this.mySocket.on('todoData', function (data) {
        Object.keys(data).forEach(function (key) {
          key != "data" ? _this.todoData[key] = data[key] : _this.todoData[key] = {};
        });
        Object.keys(data.data).sort(function (a, b) {
          return a <= b;
        }).forEach(function (key) {
          _this.todoData.data[key] = data.data[key];
        });
        _this.todoData.data[Object.keys(_this.todoData.data)[0]].expandItem = true;
      });
    }
  }, {
    key: 'toggleDone',
    value: function toggleDone(pid, id) {
      // mark the item as done
      this.todoData.data[pid].items[id].done = !this.todoData.data[pid].items[id].done;
      this.todoData.data[pid].items[id].status = this.todoData.data[pid].items[id].done == true ? "done" : "ongoing";
      this.todoData.data[pid].doneItems += this.todoData.data[pid].items[id].done ? 1 : -1;
      this.todoData.doneItems += this.todoData.data[pid].items[id].done ? 1 : -1;
      this.flushToDisk();
    }
  }]);

  return TodoController;
})();

},{}],2:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var todoListService = exports.todoListService = (function () {
  function todoListService($log, $http) {
    'ngInject';

    _classCallCheck(this, todoListService);

    this.$log = $log;
    this.$http = $http;
    this.apiHost = 'https://api.github.com/repos/Swiip/generator-gulp-angular';
    this.todoAPI = '../todo.json';
    this.getTodoList();
  }

  _createClass(todoListService, [{
    key: 'getTodoList',
    value: function getTodoList() {
      var _this = this;

      return this.$http.get(this.todoAPI).then(function (response) {
        return response.data;
      }).catch(function (error) {
        _this.$log.error('XHR Failed for datas.\n' + angular.toJson(error.data, true));
      });
    }
  }]);

  return todoListService;
})();

},{}],3:[function(require,module,exports){
'use strict';

var _main = require('./main/main.controller');

var _todoList = require('./components/todoList/todoList.service');

var _todo = require('./components/todo/todo.directive');

var _index = require('./index.route');

/* global moment:false, io:true */

angular.module('baby_view', ['ngAnimate', 'ui.router', 'toastr']).constant('moment', moment).constant('io', io).config(_index.routerConfig).service('todoList', _todoList.todoListService).constant('mySocket', io.connect('http://localhost:8000')).controller('MainController', _main.MainController).directive('todo', _todo.TodoDirective);

},{"./components/todo/todo.directive":1,"./components/todoList/todoList.service":2,"./index.route":4,"./main/main.controller":5}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.routerConfig = routerConfig;
function routerConfig($stateProvider, $urlRouterProvider) {
  'ngInject';

  $stateProvider.state('home', {
    url: '/',
    templateUrl: 'template/main.html',
    controller: 'MainController',
    controllerAs: 'main'
  });

  $urlRouterProvider.otherwise('/');
}

},{}],5:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MainController = exports.MainController = (function () {
  // the basic structure of the main content

  function MainController($scope, $timeout, toastr) {
    'ngInject';

    _classCallCheck(this, MainController);

    this.awesomeThings = [];
    this.classAnimation = '';
    this.creationDate = 1449539571104;
    this.toastr = toastr;
    $scope.creationDate = this.creationDate;

    this.activate($timeout);
  }

  _createClass(MainController, [{
    key: 'activate',
    value: function activate($timeout) {
      var _this = this;

      $timeout(function () {
        _this.classAnimation = 'rubberBand';
      }, 4000);
    }
  }, {
    key: 'showToastr',
    value: function showToastr() {
      this.toastr.info('Fork <a href="https://github.com/Swiip/generator-gulp-angular" target="_blank"><b>generator-gulp-angular</b></a>');
      this.classAnimation = '';
    }
  }]);

  return MainController;
})();

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc3JjL2NvbXBvbmVudHMvdG9kby90b2RvLmRpcmVjdGl2ZS5qcyIsImFwcC9zcmMvY29tcG9uZW50cy90b2RvTGlzdC90b2RvTGlzdC5zZXJ2aWNlLmpzIiwiYXBwL3NyYy9pbmRleC5qcyIsImFwcC9zcmMvaW5kZXgucm91dGUuanMiLCJhcHAvc3JjL21haW4vbWFpbi5jb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OztRQ0FnQixhQUFhLEdBQWIsYUFBYTs7OztBQUF0QixTQUFTLGFBQWEsR0FBRztBQUM5QixZQUFVLENBQUM7O0FBRVgsTUFBSSxTQUFTLEdBQUc7QUFDZCxZQUFRLEVBQUUsR0FBRztBQUNiLFNBQUssRUFBRTtBQUNILGNBQVEsRUFBRyxHQUFHO0tBQ2pCO0FBQ0QsV0FBTyxFQUFFLElBQUk7QUFDYixlQUFXLEVBQUUsb0JBQW9CO0FBQ2pDLFFBQUksRUFBRSxRQUFRO0FBQ2QsY0FBVSxFQUFFLGNBQWM7QUFDMUIsZ0JBQVksRUFBRSxJQUFJO0dBQ25CLENBQUM7O0FBRUYsU0FBTyxTQUFTLENBQUM7O0FBRWpCLFdBQVMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUU7QUFDM0IsTUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztHQUNyQjtDQUNGOztJQUVLLGNBQWM7QUFDbEIsV0FESSxjQUFjLENBQ0wsSUFBSSxFQUFFLFFBQVEsRUFBQyxPQUFPLEVBQUMsTUFBTSxFQUFDLFFBQVEsRUFBRTtBQUNuRCxjQUFVLENBQUM7OzBCQUZULGNBQWM7O0FBSWhCLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO0FBQ2hCLFFBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO0FBQ3RCLFFBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFBO0FBQ3JCLFFBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFB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VyxFQUFFLG9CQUFvQjtBQUNqQyxjQUFVLEVBQUUsZ0JBQWdCO0FBQzVCLGdCQUFZLEVBQUUsTUFBTTtHQUNyQixDQUFDLENBQUM7O0FBRUwsb0JBQWtCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ25DOzs7Ozs7Ozs7Ozs7O0lDWFksY0FBYyxXQUFkLGNBQWM7OztBQUV6QixXQUZXLGNBQWMsQ0FFWixNQUFNLEVBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRTtBQUNwQyxjQUFVLENBQUM7OzBCQUhGLGNBQWM7O0FBS3ZCLFFBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQ3hCLFFBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLFFBQUksQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDO0FBQ2xDLFFBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3JCLFVBQU0sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQzs7QUFFeEMsUUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztHQUN6Qjs7ZUFaVSxjQUFjOzs2QkFjaEIsUUFBUSxFQUFFOzs7QUFDakIsY0FBUSxDQUFDLFlBQU07QUFDYixjQUFLLGNBQWMsR0FBRyxZQUFZLENBQUM7T0FDcEMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNWOzs7aUNBRVk7QUFDWCxVQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrSEFBa0gsQ0FBQyxDQUFDO0FBQ3JJLFVBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO0tBQzFCOzs7U0F2QlUsY0FBYyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJleHBvcnQgZnVuY3Rpb24gVG9kb0RpcmVjdGl2ZSgpIHtcbiAgJ25nSW5qZWN0JztcblxuICBsZXQgZGlyZWN0aXZlID0ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgc2NvcGU6IHtcbiAgICAgICAgY29sbGFwc2UgOiAnPSdcbiAgICB9LFxuICAgIHJlcGxhY2U6IHRydWUsXG4gICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZS90b2RvLmh0bWwnLFxuICAgIGxpbms6IGxpbmtGdW5jLFxuICAgIGNvbnRyb2xsZXI6IFRvZG9Db250cm9sbGVyLFxuICAgIGNvbnRyb2xsZXJBczogJ3RtJ1xuICB9O1xuXG4gIHJldHVybiBkaXJlY3RpdmU7XG5cbiAgZnVuY3Rpb24gbGlua0Z1bmMoc2NvcGUsIGVsKSB7XG4gICAgZWwuYWRkQ2xhc3MoJ3RvZG8nKTtcbiAgfVxufVxuXG5jbGFzcyBUb2RvQ29udHJvbGxlciB7XG4gIGNvbnN0cnVjdG9yICgkbG9nLCB0b2RvTGlzdCwkZmlsdGVyLG1vbWVudCxteVNvY2tldCkge1xuICAgICduZ0luamVjdCc7XG5cbiAgICB0aGlzLiRsb2cgPSAkbG9nXG4gICAgdGhpcy4kZmlsdGVyID0gJGZpbHRlclxuICAgIHRoaXMuY29sbGFwc2UgPSBmYWxzZVxuICAgIHRoaXMudG9kb0RhdGEgPSB7fVxuICAgIHRoaXMubW9tZW50ID0gbW9tZW50XG4gICAgLy8gaW5pdGlhbCBkYXRhXG4gICAgdGhpcy5teVNvY2tldCA9IG15U29ja2V0XG4gICAgdGhpcy5yZWFkRnJvbURpc2sodG9kb0xpc3QpXG4gIH1cbiAgdG9nZ2xlQ29sbGFwc2UoKXtcbiAgICB0aGlzLmNvbGxhcHNlID0gIXRoaXMuY29sbGFwc2VcbiAgfVxuICBhZGRUb2RvKHRvZG8pe1xuICAgIGlmKHRoaXMuY29sbGFwc2Upe1xuICAgICAgdGhpcy50b2dnbGVDb2xsYXBzZSgpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdmFyIGRhdGUgPSB0aGlzLm1vbWVudChuZXcgRGF0ZSgpKS5mb3JtYXQoJ1lZWVktTU0tREQnKVxuICAgIHRoaXMudG9kb0RhdGEuZGF0YVtkYXRlXSA9IHRoaXMudG9kb0RhdGEuZGF0YVtkYXRlXSB8fCB7fVxuICAgIHRoaXMudG9kb0RhdGEuZGF0YVtkYXRlXS5kb25lSXRlbXMgPSB0aGlzLnRvZG9EYXRhLmRhdGFbZGF0ZV0uZG9uZUl0ZW1zIHx8IDBcbiAgICB0aGlzLnRvZG9EYXRhLmRhdGFbZGF0ZV0uaXRlbXMgPSB0aGlzLnRvZG9EYXRhLmRhdGFbZGF0ZV0uaXRlbXMgfHwgW11cbiAgICB2YXIgc2luZ2xlRGF0YSA9IHt9XG4gICAgc2luZ2xlRGF0YS5jb250ZW50ID0gdG9kby5jb250ZW50XG4gICAgc2luZ2xlRGF0YS5zdGF0dXMgPSBcIm9uZ29pbmdcIlxuICAgIHNpbmdsZURhdGEuZG9uZSA9IGZhbHNlXG4gICAgc2luZ2xlRGF0YS5kYXRlID0gdGhpcy5tb21lbnQoKS5mb3JtYXQoKVxuICAgIHRoaXMudG9kb0RhdGEuZGF0YVtkYXRlXS5pdGVtcy51bnNoaWZ0KHNpbmdsZURhdGEpXG4gICAgdGhpcy5mbHVzaFRvRGlzaygpXG4gIH1cbiAgZGVsZXRlVG9kbyhwaWQsaWQpe1xuICAgIC8vIHN0YXR1cyBpbmRpY2F0ZXMgd2hldGhlciBpdCBpcyBhIGRvbmUgaXRlbSBvciB1bmRvbmUgaXRlbVxuICAgIGlmKHRoaXMudG9kb0RhdGEuZGF0YVtwaWRdLml0ZW1zW2lkXS5kb25lKXtcbiAgICAgIHRoaXMudG9kb0RhdGEuZGF0YVtwaWRdLmRvbmVJdGVtcyArPSAtMVxuICAgICAgdGhpcy50b2RvRGF0YS5kb25lSXRlbXMgKz0gLTFcbiAgICB9XG4gICAgdGhpcy50b2RvRGF0YS5kYXRhW3BpZF0uaXRlbXMuc3BsaWNlKGlkLDEpXG4gICAgdGhpcy50b2RvRGF0YS5kYXRhW3BpZF0uaXRlbXMubGVuZ3RoICE9IDAgfHwgZGVsZXRlIHRoaXMudG9kb0RhdGEuZGF0YVtwaWRdXG4gICAgdGhpcy5mbHVzaFRvRGlzaygpXG4gIH1cbiAgY2xlYXIoKXtcbiAgICAvLyBlbXB0eSBzdG9yYWdlXG4gICAgdGhpcy50b2RvRGF0YS5kYXRhID0ge31cbiAgfVxuICBmbHVzaFRvRGlzaygpe1xuICAgIC8vIHNhdmUgaW50byBkaXNrXG4gICAgaWYodGhpcy5teVNvY2tldC5jb25uZWN0ZWQpe1xuICAgICAgdGhpcy5teVNvY2tldC5lbWl0KFwid3JpdGVUb2RvXCIsdGhpcy50b2RvRGF0YSlcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuJGxvZy5pbmZvKFwiTm8gY29ubmVjdGlvbnMhIVwiKVxuICAgIH1cbiAgfVxuICByZWFkRnJvbURpc2sodG9kb0xpc3Qpe1xuICAgIC8vIHJlYWQgZnJvbSB0aGUgZGlzayBvciBmcm9tIHRoZSBzb2NrZXQgaW9cbiAgICB0aGlzLm15U29ja2V0LmVtaXQoXCJnaXZlTWVUb2RvRGF0YVwiKVxuICAgIHZhciBfdGhpcyA9IHRoaXNcbiAgICB0aGlzLm15U29ja2V0Lm9uKFwiY29ubmVjdF9lcnJvclwiLCgpID0+IHtcbiAgICAgIF90aGlzLiRsb2cuaW5mbyhcIkRpc2Nvbm5lY3RlZCB3aXRoIHRoZSBzZXJ2ZXIsIFlvdXIgY2hhbmdlcyB3b24ndCBiZSBzYXZlZFwiKVxuICAgICAgX3RoaXMubXlTb2NrZXQuZGlzY29ubmVjdCgpXG4gICAgICByZXR1cm4gdG9kb0xpc3QuZ2V0VG9kb0xpc3QoMTApLnRoZW4oKGRhdGEpID0+IHtcblxuICAgICAgICBPYmplY3Qua2V5cyhkYXRhKS5mb3JFYWNoKCAoa2V5KSA9PntcbiAgICAgICAgICBrZXkgIT0gXCJkYXRhXCIgPyBfdGhpcy50b2RvRGF0YVtrZXldID0gZGF0YVtrZXldIDogX3RoaXMudG9kb0RhdGFba2V5XSA9IHt9XG4gICAgICAgIH0pXG4gICAgICAgIE9iamVjdC5rZXlzKGRhdGEuZGF0YSkuc29ydChmdW5jdGlvbihhLCBiKXtyZXR1cm4gYTw9Yn0pLmZvckVhY2goIChrZXkpID0+e1xuICAgICAgICAgIF90aGlzLnRvZG9EYXRhLmRhdGFba2V5XSA9IGRhdGEuZGF0YVtrZXldXG4gICAgICAgIH0pXG4gICAgICAgIF90aGlzLnRvZG9EYXRhLmRhdGFbT2JqZWN0LmtleXMoX3RoaXMudG9kb0RhdGEuZGF0YSlbMF1dLmV4cGFuZEl0ZW0gPSB0cnVlXG5cbiAgICAgICAgcmV0dXJuIF90aGlzLnRvZG9EYXRhO1xuICAgICAgfSk7XG4gICAgfSlcbiAgICB0aGlzLm15U29ja2V0Lm9uKCd0b2RvRGF0YScsIChkYXRhKSA9PiB7XG4gICAgICBPYmplY3Qua2V5cyhkYXRhKS5mb3JFYWNoKCAoa2V5KSA9PntcbiAgICAgICAga2V5ICE9IFwiZGF0YVwiID8gX3RoaXMudG9kb0RhdGFba2V5XSA9IGRhdGFba2V5XSA6IF90aGlzLnRvZG9EYXRhW2tleV0gPSB7fVxuICAgICAgfSlcbiAgICAgIE9iamVjdC5rZXlzKGRhdGEuZGF0YSkuc29ydChmdW5jdGlvbihhLCBiKXtyZXR1cm4gYTw9Yn0pLmZvckVhY2goIChrZXkpID0+e1xuICAgICAgICBfdGhpcy50b2RvRGF0YS5kYXRhW2tleV0gPSBkYXRhLmRhdGFba2V5XVxuICAgICAgfSlcbiAgICAgIF90aGlzLnRvZG9EYXRhLmRhdGFbT2JqZWN0LmtleXMoX3RoaXMudG9kb0RhdGEuZGF0YSlbMF1dLmV4cGFuZEl0ZW0gPSB0cnVlXG4gICAgfSk7XG4gIH1cbiAgdG9nZ2xlRG9uZShwaWQsaWQpe1xuICAgIC8vIG1hcmsgdGhlIGl0ZW0gYXMgZG9uZVxuICAgIHRoaXMudG9kb0RhdGEuZGF0YVtwaWRdLml0ZW1zW2lkXS5kb25lID0gIXRoaXMudG9kb0RhdGEuZGF0YVtwaWRdLml0ZW1zW2lkXS5kb25lXG4gICAgdGhpcy50b2RvRGF0YS5kYXRhW3BpZF0uaXRlbXNbaWRdLnN0YXR1cyA9IHRoaXMudG9kb0RhdGEuZGF0YVtwaWRdLml0ZW1zW2lkXS5kb25lID09IHRydWUgPyBcImRvbmVcIjpcIm9uZ29pbmdcIlxuICAgIHRoaXMudG9kb0RhdGEuZGF0YVtwaWRdLmRvbmVJdGVtcyArPSB0aGlzLnRvZG9EYXRhLmRhdGFbcGlkXS5pdGVtc1tpZF0uZG9uZSA/IDEgOiAtMVxuICAgIHRoaXMudG9kb0RhdGEuZG9uZUl0ZW1zICs9IHRoaXMudG9kb0RhdGEuZGF0YVtwaWRdLml0ZW1zW2lkXS5kb25lID8gMSA6IC0xXG4gICAgdGhpcy5mbHVzaFRvRGlzaygpXG4gIH1cbn1cbiIsImV4cG9ydCBjbGFzcyB0b2RvTGlzdFNlcnZpY2V7XG4gIGNvbnN0cnVjdG9yICgkbG9nLCAkaHR0cCkge1xuICAgICduZ0luamVjdCc7XG5cbiAgICB0aGlzLiRsb2cgPSAkbG9nO1xuICAgIHRoaXMuJGh0dHAgPSAkaHR0cDtcbiAgICB0aGlzLmFwaUhvc3QgPSAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9Td2lpcC9nZW5lcmF0b3ItZ3VscC1hbmd1bGFyJztcbiAgICB0aGlzLnRvZG9BUEkgPSAnLi4vdG9kby5qc29uJztcbiAgICB0aGlzLmdldFRvZG9MaXN0KClcbiAgfVxuICBnZXRUb2RvTGlzdCgpIHtcbiAgICByZXR1cm4gdGhpcy4kaHR0cC5nZXQodGhpcy50b2RvQVBJKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgdGhpcy4kbG9nLmVycm9yKCdYSFIgRmFpbGVkIGZvciBkYXRhcy5cXG4nICsgYW5ndWxhci50b0pzb24oZXJyb3IuZGF0YSwgdHJ1ZSkpO1xuICAgICAgfSk7XG4gIH1cbn1cbiIsIi8qIGdsb2JhbCBtb21lbnQ6ZmFsc2UsIGlvOnRydWUgKi9cblxuaW1wb3J0IHsgTWFpbkNvbnRyb2xsZXIgfSBmcm9tICcuL21haW4vbWFpbi5jb250cm9sbGVyJztcbmltcG9ydCB7IHRvZG9MaXN0U2VydmljZX0gZnJvbSAnLi9jb21wb25lbnRzL3RvZG9MaXN0L3RvZG9MaXN0LnNlcnZpY2UnO1xuaW1wb3J0IHsgVG9kb0RpcmVjdGl2ZX0gZnJvbSAnLi9jb21wb25lbnRzL3RvZG8vdG9kby5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgcm91dGVyQ29uZmlnIH0gZnJvbSAnLi9pbmRleC5yb3V0ZSc7XG5cbmFuZ3VsYXIubW9kdWxlKCdiYWJ5X3ZpZXcnLCBbJ25nQW5pbWF0ZScsJ3VpLnJvdXRlcicsJ3RvYXN0ciddKVxuICAuY29uc3RhbnQoJ21vbWVudCcsIG1vbWVudClcbiAgLmNvbnN0YW50KCdpbycsIGlvKVxuICAuY29uZmlnKHJvdXRlckNvbmZpZylcbiAgLnNlcnZpY2UoJ3RvZG9MaXN0JywgdG9kb0xpc3RTZXJ2aWNlKVxuICAuY29uc3RhbnQoJ215U29ja2V0Jyxpby5jb25uZWN0KCdodHRwOi8vbG9jYWxob3N0OjgwMDAnKSlcbiAgLmNvbnRyb2xsZXIoJ01haW5Db250cm9sbGVyJywgTWFpbkNvbnRyb2xsZXIpXG4gIC5kaXJlY3RpdmUoJ3RvZG8nLCBUb2RvRGlyZWN0aXZlKVxuIiwiZXhwb3J0IGZ1bmN0aW9uIHJvdXRlckNvbmZpZyAoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuICAnbmdJbmplY3QnO1xuICAkc3RhdGVQcm92aWRlclxuICAgIC5zdGF0ZSgnaG9tZScsIHtcbiAgICAgIHVybDogJy8nLFxuICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZS9tYWluLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ01haW5Db250cm9sbGVyJyxcbiAgICAgIGNvbnRyb2xsZXJBczogJ21haW4nXG4gICAgfSk7XG5cbiAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xufVxuIiwiZXhwb3J0IGNsYXNzIE1haW5Db250cm9sbGVyIHtcbiAgLy8gdGhlIGJhc2ljIHN0cnVjdHVyZSBvZiB0aGUgbWFpbiBjb250ZW50XG4gIGNvbnN0cnVjdG9yICgkc2NvcGUsJHRpbWVvdXQsIHRvYXN0cikge1xuICAgICduZ0luamVjdCc7XG5cbiAgICB0aGlzLmF3ZXNvbWVUaGluZ3MgPSBbXTtcbiAgICB0aGlzLmNsYXNzQW5pbWF0aW9uID0gJyc7XG4gICAgdGhpcy5jcmVhdGlvbkRhdGUgPSAxNDQ5NTM5NTcxMTA0O1xuICAgIHRoaXMudG9hc3RyID0gdG9hc3RyO1xuICAgICRzY29wZS5jcmVhdGlvbkRhdGUgPSB0aGlzLmNyZWF0aW9uRGF0ZTtcblxuICAgIHRoaXMuYWN0aXZhdGUoJHRpbWVvdXQpO1xuICB9XG5cbiAgYWN0aXZhdGUoJHRpbWVvdXQpIHtcbiAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLmNsYXNzQW5pbWF0aW9uID0gJ3J1YmJlckJhbmQnO1xuICAgIH0sIDQwMDApO1xuICB9XG5cbiAgc2hvd1RvYXN0cigpIHtcbiAgICB0aGlzLnRvYXN0ci5pbmZvKCdGb3JrIDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vU3dpaXAvZ2VuZXJhdG9yLWd1bHAtYW5ndWxhclwiIHRhcmdldD1cIl9ibGFua1wiPjxiPmdlbmVyYXRvci1ndWxwLWFuZ3VsYXI8L2I+PC9hPicpO1xuICAgIHRoaXMuY2xhc3NBbmltYXRpb24gPSAnJztcbiAgfVxufVxuIl19
