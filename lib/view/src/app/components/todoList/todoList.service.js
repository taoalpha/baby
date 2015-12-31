export class todoListService{
  constructor ($log, $http) {
    'ngInject';

    this.$log = $log;
    this.$http = $http;
    this.apiHost = 'https://api.github.com/repos/Swiip/generator-gulp-angular';
    this.todoAPI = '../todo.json';
    this.getTodoList()
  }
  getTodoList() {
    return this.$http.get(this.todoAPI)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        this.$log.error('XHR Failed for datas.\n' + angular.toJson(error.data, true));
      });
  }
}
