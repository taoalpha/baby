/* global moment:false, io:true */

import { MainController } from './main/main.controller';
import { todoListService} from './components/todoList/todoList.service';
import { TodoDirective} from './components/todo/todo.directive';
import { routerConfig } from './index.route';

angular.module('baby_view', ['ngAnimate','ui.router','toastr'])
  .constant('moment', moment)
  .constant('io', io)
  .config(routerConfig)
  .service('todoList', todoListService)
  .constant('mySocket',io.connect('http://localhost:8000'))
  .controller('MainController', MainController)
  .directive('todo', TodoDirective)
