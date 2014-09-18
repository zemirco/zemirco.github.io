
angular
.module('myApp', [])
.config([function() {}])
.controller('IndexCtrl', ['$scope', '$http', function($scope, $http) {

  $scope.countries = [
    'Germany',
    'Italy',
    'Spain',
    'Netherlands',
    'France'
  ]

  $http.get('http://104.131.24.97:49159/json').success(function(data) {
    $scope.animals = data;
  });

}]);
