'use strict';

// Criação do módulo geral do sistema
var appAngular = angular.module('FCamara', ['ngRoute']);
//rotas URL
appAngular.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/', {
          redirectTo: '/home',
      })

    .when('/home', {
        templateUrl: '/Home',
        controller: 'HomeController'
    })

}])

// variável global para o caminho do serviço
appAngular.constant('serviceBasePath', 'http://localhost:56085');

//controler do angular
appAngular.controller('HomeController', ['$scope', '$http', 'dataService', 'accountService', '$location', function ($scope, $http, dataService, accountService, $location) {
    $scope.data = "";
    $scope.ListProdutos = [];
    $scope.ExibirLogin = true;

    $scope.Usuario = {
        username: '',
        password: ''
    }

    $scope.GetProdutos = function () {
        dataService.GetProdutosData().then(function (data) {
            $scope.ListProdutos = data;
            $scope.ExibirLogin = false;
        }, function (error) {
            $scope.ExibirLogin = true;
            $scope.limparCamposLogin();
            $scope.limparListaProdutos();
            $scope.verificarErro(error);
        })
    }

    $scope.login = function () {
        accountService.login($scope.Usuario).then(function (data) {
            $scope.GetProdutosLogin();
            $scope.ExibirLogin = false;
        }, function (error) {
            $scope.ExibirLogin = true;
            $scope.limparListaProdutos();
            $scope.verificarErro(error);
        })
    }

    $scope.verificarErro = function (error) {
        if (error.status == 401) {
            toastr.warning('Sessão Expirada.')
        }
        else if (rejection.status === 403) {
            toastr.warning('Acesso não autorizado.')
        }
    }

    $scope.GetProdutosLogin = function () {
        dataService.GetProdutosData().then(function (data) {
            $scope.ListProdutos = data;
            $scope.ExibirLogin = false;
        })
    }

    iniciar();

    function iniciar() {
        dataService.GetProdutosData().then(function (data) {
            $scope.ListProdutos = data;
            $scope.ExibirLogin = false;
        }, function (error) {
            $location.path('/home');
            $scope.$apply();
        })
    }

    $scope.limparCamposLogin = function () {
        $scope.Usuario = {};
    };

    $scope.limparListaProdutos = function () {
        $scope.ListProdutos = [];
    };

    $scope.converterFloatParaMoeda = function (valor) {
        var inteiro = null, decimal = null, c = null, j = null;
        var aux = new Array();
        valor = "" + valor;
        c = valor.indexOf(".", 0);
        //encontrou o ponto na string
        if (c > 0) {
            //separa as partes em inteiro e decimal
            inteiro = valor.substring(0, c);
            decimal = valor.substring(c + 1, valor.length);
        } else {
            inteiro = valor;
        }

        //pega a parte inteiro de 3 em 3 partes
        for (j = inteiro.length, c = 0; j > 0; j -= 3, c++) {
            aux[c] = inteiro.substring(j - 3, j);
        }

        //percorre a string acrescentando os pontos
        inteiro = "";
        for (c = aux.length - 1; c >= 0; c--) {
            inteiro += aux[c] + '.';
        }
        //retirando o ultimo ponto e finalizando a parte inteiro

        inteiro = inteiro.substring(0, inteiro.length - 1);
        var decimalAux = parseInt(decimal);

        if (isNaN(decimalAux)) {
            decimal = "00";
        } else {
            decimal = "" + decimal;
            if (decimal.length === 1) {
                decimal = decimal + "0";
            }
        }

        valor = inteiro + "," + decimal;

        return valor;
    }

}]);

//factories
appAngular.factory('dataService', ['$http', 'serviceBasePath', function ($http, serviceBasePath) {
    
    var fac = {};
    fac.GetProdutosData = function () {
        return $http.get(serviceBasePath + '/api/data/getProdutos')
            .then(function (response) {
                return response.data;
            })
    }

    return fac;
}])

appAngular.factory('userService', function () {

    var fac = {};
    fac.CurrentUser = null;
    fac.SetCurrentUser = function (user) {
        fac.CurrentUser = user;
        sessionStorage.user = angular.toJson(user);
    }

    fac.GetCurrentUser = function () {
        fac.CurrentUser = angular.fromJson(sessionStorage.user);
        return fac.CurrentUser;
    }

    return fac;
})

appAngular.factory('accountService', ['$http', '$q', 'serviceBasePath', 'userService', 'dataService', function ($http, $q, serviceBasePath, userService, dataService) {

    var fac = {};

    fac.login = function (user) {
        var obj = { 'username': user.username, 'password': user.password, 'grant_type': 'password' };
        Object.toparams = function ObjectsToParams(obj) {
            var p = [];

            for (var key in obj) {
                p.push(key + '=' + encodeURIComponent(obj[key]));
            }

            return p.join('&');
        }

        var defer = $q.defer();
        $http({
            method: 'post',
            url: serviceBasePath + '/token',
            data: Object.toparams(obj),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).then(function (response) {
            userService.SetCurrentUser(response.data);
            defer.resolve(response.data);
        }, function (error) {
            defer.reject(error.data);
        })

        return defer.promise;
    }

    fac.logout = function () {
        userService.CurrentUser = null;
        userService.SetCurrentUser(userService.CurrentUser);
    }
    return fac;
}])
//http interceptor

appAngular.config(['$httpProvider', function ($httpProvider) {
    var interceptor = function (userService, $q, $location) {
        return {
            request: function (config) {
                var currentUser = userService.GetCurrentUser();
                if (currentUser != null) {
                    config.headers['Authorization'] = 'Bearer ' + currentUser.access_token;
                }

                return config;
            },
            responseError: function (rejection) {
                if (rejection.status === 401) {
                    $location.path('/home');
                    return $q.reject(rejection);
                }

                if (rejection.status === 403) {
                    $location.path('/home');
                    return $q.reject(rejection);
                }
                return $q.reject(rejection);
            }
        }
    }

    var params = ['userService', '$q', '$location'];
    interceptor.$inject = params;

    $httpProvider.interceptors.push(interceptor);
}])

