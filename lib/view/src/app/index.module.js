/* global malarkey:false, moment:false */

import { config } from './index.config';
import { routerConfig } from './index.route';
import { runBlock } from './index.run';
import { MainController } from './main/main.controller';
import { todoListService} from '../app/components/todoList/todoList.service';
import { MalarkeyDirective } from '../app/components/malarkey/malarkey.directive';
import { bgImgDirective } from '../app/components/partials/bgImg.directive';

// socket io for later use
//var socket = io('http://localhost:8000');
//socket.on('getrTodoList', function (data) {
//  console.log(data);
//});

angular.module('baby_view', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngSanitize', 'ngMessages', 'ngAria', 'ngResource', 'ui.router', 'ui.bootstrap', 'toastr'])
  .constant('malarkey', malarkey)
  .constant('moment', moment)
  .config(config)
  .config(routerConfig)
  .run(runBlock)
  .service('githubContributor', todoListService)
  .controller('MainController', MainController)
  .directive('acmeMalarkey', MalarkeyDirective)
  .directive('bgImg', bgImgDirective)

