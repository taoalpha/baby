export function WidgetDirective() {
  'ngInject';

  let directive = {
    restrict: 'E',
    scope: {
      selected: "="
    },
    replace: true,
    templateUrl: 'template/widget.html',
    link: linkFunc,
    controller: WidgetController,
    controllerAs: 'wm'
  };

  return directive;

  function linkFunc(scope, el) {
    el.addClass('widget');
    el.addClass(scope.name);
    scope.selected = _removeTime(scope.selected || moment());
    scope.month = scope.selected.clone();

    var start = scope.selected.clone();
    start.date(1);
    _removeTime(start.day(0));

    _buildMonth(scope, start, scope.month);

    scope.select = function(day) {
        scope.selected = day.date;  
    };

    scope.next = function() {
        var next = scope.month.clone();
        _removeTime(next.month(next.month()+1).date(1));
        scope.month.month(scope.month.month()+1);
        _buildMonth(scope, next, scope.month);
    };

    scope.previous = function() {
        var previous = scope.month.clone();
        _removeTime(previous.month(previous.month()-1).date(1));
        scope.month.month(scope.month.month()-1);
        _buildMonth(scope, previous, scope.month);
    };
  }
  function _removeTime(date) {
      return date.day(0).hour(0).minute(0).second(0).millisecond(0);
  }

  function _buildMonth(scope, start, month) {
      scope.weeks = [];
      var done = false, date = start.clone(), monthIndex = date.month(), count = 0;
      while (!done) {
          scope.weeks.push({ days: _buildWeek(date.clone(), month) });
          date.add(1, "w");
          done = count++ > 2 && monthIndex !== date.month();
          monthIndex = date.month();
      }
  }

  function _buildWeek(date, month) {
      var days = [];
      for (var i = 0; i < 7; i++) {
          days.push({
              name: date.format("dd").substring(0, 1),
              number: date.date(),
              isCurrentMonth: date.month() === month.month(),
              isToday: date.isSame(new Date(), "day"),
              date: date
          });
          date = date.clone();
          date.add(1, "d");
      }
      return days;
  }
}

class WidgetController {
  constructor ($scope,$log,$http,moment,$attrs,mySocket) {
    'ngInject';

    this.$log = $log
    this.$http = $http
    this.showTodoData = {}
    this.moment = moment
    this.$scope = $scope
    this.day = moment()
    // initial data
    this.mySocket = mySocket
    var _this = this
    this.$scope.$on('outer', function() {
      _this.$log.info("Outer Render Finished at:"+moment().second())
    })

    // data
    this.summaryData = {}
    this.readFromDisk()
  }
  readFromDisk(){
    // read from the disk or from the socket io
    this.mySocket.emit("giveMeSummaryData")
    var _this = this
    this.mySocket.on("connect_error",() => {
      _this.$log.info("Disconnected with the server, Your changes won't be saved")
      _this.mySocket.disconnect()
      return this.getTodoListFromApi('./gSummary.json').then((data) => {
        _this.summaryData = data
      });
    })
    this.$log.info("getting data..."+this.moment().second())
    this.mySocket.on('summaryData', (data) => {
      _this.$log.info("got data..."+this.moment().second())
      _this.$log.info(data)
      _this.summaryData = data
    });
  }
  getTodoListFromApi(api) {
    return this.$http.get(api)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        this.$log.error('XHR Failed for datas.\n' + angular.toJson(error.data, true));
      });
  }
}
