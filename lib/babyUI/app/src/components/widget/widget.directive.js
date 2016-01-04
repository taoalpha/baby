export function WidgetDirective() {
  'ngInject';

  let directive = {
    restrict: 'E',
    scope: {
      selected: "=",
      name: "="
    },
    replace: true,
    templateUrl: (el,attrs)=>{return `template/widget-${attrs.name}.html`},
    link: linkFunc,
    controller: WidgetController,
    controllerAs: 'wm'
  };

  return directive;

  function linkFunc(scope, el,attrs) {
    el.addClass('widget');
    el.addClass(attrs.name);
  }
}

class WidgetController {
  constructor ($scope,$log,$element,$http,moment,$attrs,mySocket) {
    'ngInject';

    this.$log = $log
    this.$element = $element
    this.$http = $http
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
  select(day){
    this.selected = day.date;  
  }
  next(){
    var next = this.month.clone();
    this.removeTime(next.month(next.month()+1).date(1));
    this.month.month(this.month.month()+1);
    this.buildMonth(next, this.month);
  }
  previous(){
    var previous = this.month.clone();
    this.removeTime(previous.month(previous.month()-1).date(1));
    this.month.month(this.month.month()-1);
    this.buildMonth(previous, this.month);
  }
  removeTime(date){
    return date.day(0).hour(0).minute(0).second(0).millisecond(0);
  }
  buildMonth(start, month) {
    this.weeks = [];
    var done = false, date = start.clone(), monthIndex = date.month(), count = 0;
    while (!done) {
        this.weeks.push({ days: this.buildWeek(date.clone(), month) });
        date.add(1, "w");
        done = count++ > 2 && monthIndex !== date.month();
        monthIndex = date.month();
    }
  }
  showStat(day){
    this.addCount = day.addCount
    this.delCount = day.delCount
    this.select(day)
  }
  buildWeek(date, month) {
    var days = [];
    for (var i = 0; i < 7; i++) {
        days.push({
            name: date.format("dd").substring(0, 1),
            number: date.date(),
            isCurrentMonth: date.month() === month.month(),
            isToday: date.isSame(new Date(), "day"),
            addCount:this.summaryData.coding.days[date.format("M/D/YYYY")] ? this.summaryData.coding.days[date.format("M/D/YYYY")].addCount : 0, 
            delCount:this.summaryData.coding.days[date.format("M/D/YYYY")] ? this.summaryData.coding.days[date.format("M/D/YYYY")].delCount : 0, 
            date: date
        });
        date = date.clone();
        date.add(1, "d");
    }
    return days;
  }
  buildCalendar(){
    this.selected = this.removeTime(this.selected || moment());
    this.month = this.selected.clone();
    var start = this.selected.clone();
    start.date(1);
    this.removeTime(start.day(0));
    this.buildMonth(start, this.month);
    this.addCount = this.summaryData.coding.addCount
    this.delCount = this.summaryData.coding.delCount
    this.$scope.$digest()
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
        _this.buildCalendar()
      });
    })
    this.$log.info("getting data..."+this.moment().second())
    this.mySocket.on('summaryData', (data) => {
      _this.$log.info("got data..."+this.moment().second())
      _this.summaryData = data
      _this.buildCalendar()
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
