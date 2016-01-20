export function WidgetDirective() {
  'ngInject';

  let directive = {
    restrict: 'E',
    scope: {
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

class Board{
  constructor(){
    this.base = 65;
    this.ranN = () => Math.floor(Math.random()*26);
    this.mapper = {};
    this.lang = "en";
    this.words = {
      hello:["HI","TAO"],
      indicator:["IT","IS"],
      numbers: ["","ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE","TEN","ELEVEN","TWELVE","THIRTEEN"],
      nearly: ["NEARlY","ALMOST"],
      quaters:["QUATER","TWENTY"],
      pastOrTo:"",
      clock: "O'CLOCK",
    }
  }
  randomBoard(w,h){
    // generate random board
    var i,j,board = [];
    for(i = 0; i < w; i++){
      for(j = 0; j < h; j++){
        board[i] = board[i] || []
        board[i][j] = String.fromCharCode(this.ranN()+this.base);
      }
    }
    var end = this.putWordInBoard(board,"HI",0,0,4);
    this.putWordInBoard(board,"TAO",0,end,0);
    var n = this.putWordInBoard(board,"IT",1,0,3);
    this.putWordInBoard(board,"IS",1,n,0);

    var now = new Date(),
        minutes = now.getMinutes(),
        minuteWord = "",
        hour = ( now.getHours() + 11 ) % 12 + 1,
        pastOrTo = "PAST";

    if(minutes == 30){
      minutes = -1
      minuteWord = "HALF"
    }
    if(minutes > 30){
      pastOrTo = "TO"
      hour += 1
      minutes = 60 - minutes
    }
    if(minutes % 15 == 0){
      this.putWordInBoard(board,this.words.numbers[minutes / 15],4,0,0);
      this.putWordInBoard(board,minutes / 15 == 1 ? "QUARTER" : "QUARTERS",5,0,0);
      minutes = -1
    }
    if(minutes > 13 && minutes < 20){
      minuteWord = this.words.numbers[minutes % 10] + "TEEN"
    }
    if(minutes >= 20){
      this.putWordInBoard(board,"TWENTY",4,0,0);
      if(minutes % 20 > 0){
        this.putWordInBoard(board,this.words.numbers[minutes % 20],5,0,0);
      }
      minutes = -1
    }
    if(minutes <=13){
      minuteWord = this.words.numbers[minutes]
    }

    if(minutes != -1){
      this.putWordInBoard(board,minuteWord,4,0,0);
    }
    this.putWordInBoard(board,pastOrTo,7,0,0);
    this.putWordInBoard(board,this.words.numbers[hour],8,0,0);
    this.putWordInBoard(board,"O'CLOCK",board.length-1,0,0);
    return board
  }
  putWordInBoard(board,word,line,skip,remain){
    // put the word in specific line
    // skip indicates the index of this line we should start from
    // remain indicates the index of this line we should end before
    var wordLen = word.length,
        lineLen = board[line].length,
        startIdx = Math.floor( Math.random()*( lineLen - remain - wordLen - skip ) + skip ) + 1,
        i,j;
    // startIdx indicates the start index of this word in this line <- is a random valid index
    // the minimum distance of two words in same line should be 1
    for(i = 0; i < wordLen; i++){
      board[line][startIdx++] = word[i];
      this.mapper[line+"-"+(startIdx-1)] = 1;
    }
    return startIdx  // the idx  of the last letter of the word
  }
}

class WidgetController {
  constructor ($scope,$log,$element,$http,moment,$attrs,mySocket,$interval) {
    'ngInject';

    this.$scope = $scope
    this.$scope.$on('outer', () => {
      this.$log.info("Summary Outer Render Finished at:"+moment().second())
    })

    this.$log = $log
    this.$element = $element
    this.$http = $http
    // initial data
    if($attrs.name == "calendar"){
      // data
      this.moment = moment
      this.day = moment()
      this.mySocket = mySocket
      this.summaryData = {}
      this.readFromDisk()
    }
    if($attrs.name == "clock"){
      this.board = [];
      this.mapper = {};
      this.renderBoard();
      $interval(this.renderBoard.bind(this),60*1000);
    }
  }
  renderBoard(){
    console.log("render board")
    var board = new Board();
    this.board = board.randomBoard(10,10);
    this.mapper = board.mapper;
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
    this.selected = moment()
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
    this.$log.info("getting summary data..."+this.moment().second())
    this.mySocket.on('summaryData', (data) => {
      _this.$log.info("got summary data..."+this.moment().second())
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
