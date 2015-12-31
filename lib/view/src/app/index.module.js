/* global moment:false, io:true */

import { config } from './index.config';
import { routerConfig } from './index.route';
import { runBlock } from './index.run';
import { MainController } from './main/main.controller';
import { todoListService} from '../app/components/todoList/todoList.service';
import { TodoDirective} from '../app/components/todo/todo.directive';

angular.module('baby_view', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngSanitize', 'ngMessages', 'ngAria', 'ngResource', 'ui.router', 'ui.bootstrap', 'toastr'])
  .constant('moment', moment)
  .constant('io', io)
  .config(config)
  .config(routerConfig)
  .run(runBlock)
  .service('todoList', todoListService)
  .constant('mySocket',io.connect('http://localhost:8000'))
  .controller('MainController', MainController)
  .directive('todo', TodoDirective)
