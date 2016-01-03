/* global moment:false, io:true */

import { MainController } from './main/main.controller';
import { TodoDirective} from './components/todo/todo.directive';
import { WidgetDirective} from './components/widget/widget.directive';
import { routerConfig } from './index.route';

angular.module('baby_view', ['ngAnimate','ui.router','toastr'])
  .constant('moment', moment)
  .constant('io', io)
  .config(routerConfig)
  .constant('mySocket',io.connect('http://localhost:8000'))
  .controller('MainController', MainController)
  .directive('todo', TodoDirective)
  .directive('widget', WidgetDirective)
  .directive('onFinishRender', function ($log,moment) {
    return {
        restrict: 'A',
        scope: {},
        link: function (scope, element, attrs) {
          if (scope.$parent.$first === true) {
            $log.info("Render Started"+moment().second())
          }
          if (scope.$parent.$last === true) {
            $log.info("Render End"+moment().second())
            scope.$emit(attrs.onFinishRender);
          };
            //if (attrs.ngRepeat) {
            //    if (scope.$parent.$last) {
            //        if (attrs.onFinishRender!== '') {
            //            if (typeof scope.$parent.$parent.tm[attrs.onFinishRender] === 'function') {
            //                // Executes defined function
            //                scope.$parent.$parent.tm[attrs.onFinishRender]();
            //            } else {
            //                // For watcher, if you prefer
            //                scope.$parent.$parent.tm[attrs.onFinishRender] = true;
            //            }
            //        } else {
            //            // If no value was provided than we will provide one on you controller scope, that you can watch
            //            // WARNING: Multiple instances of this directive could yeild unwanted results.
            //            scope.$parent.$parent.ngRepeatEnd = true;
            //        }
            //    }
            //} else {
            //    throw 'onFinishRender: `ngRepeat` Directive required to use this Directive';
            //}
        }
    };
  });
