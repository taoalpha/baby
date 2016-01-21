/* global moment:false, io:true */

import { MainController } from './components/main.controller';
import { DelegationController } from './components/delegation/delegation.controller';
import { TodoDirective} from './components/todo/todo.directive';
import { RSSDirective} from './components/rss/rss.directive';
import { ViewFrameDirective} from './components/viewframe/viewframe.directive';
import { WidgetDirective} from './components/widget/widget.directive';
import { routerConfig } from './index.route';

angular.module('baby_view', ['ngAnimate','ngCookies','ui.router','toastr'])
  .constant('moment', moment)
  .constant('io', io)
  .config(routerConfig)
  //.constant('mySocket',io.connect('104.229.171.106:8000'))
  .constant('mySocket',io.connect('localhost:8000'))
  .controller('MainController', MainController)
  .controller('DelegationController', DelegationController)
  .directive('todo', TodoDirective)
  .directive('rss', RSSDirective)
  .directive('widget', WidgetDirective)
  .directive('viewframe', ViewFrameDirective)
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
        }
    };
  })
  .filter('orderObjectBy', function() {
    return function(items, field, reverse) {
      var filtered = [];
      angular.forEach(items, function(item,i) {
        item.key = i
        filtered.push(item);
      });
      filtered.sort(function (a, b) {
        return (a[field] > b[field] ? 1 : -1);
      });
      if(reverse) filtered.reverse();
      return filtered;
    }
  })
