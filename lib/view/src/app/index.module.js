/* global moment:false, io:true */

import { config } from './index.config';
import { routerConfig } from './index.route';
import { runBlock } from './index.run';
import { MainController } from './main/main.controller';
import { todoListService} from '../app/components/todoList/todoList.service';
import { TodoDirective} from '../app/components/todo/todo.directive';

angular.module('baby_view', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngSanitize', 'ngMessages', 'ngAria', 'ngResource', 'ui.router', 'ui.bootstrap', 'toastr','btford.socket-io'])
  .constant('moment', moment)
  .constant('io', io)
  .config(config)
  .config(routerConfig)
  .run(runBlock)
  .service('todoList', todoListService)
  .factory('mySocket', function (socketFactory) {
    var myIoSocket = io.connect('http://localhost:8000');
    var mySocket = socketFactory({
      ioSocket: myIoSocket
    });
    mySocket.forward('error');
    return mySocket;
  })
  .controller('MainController', MainController)
  .directive('todo', TodoDirective)
