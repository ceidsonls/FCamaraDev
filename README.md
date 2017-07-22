# Introduction
Utilizando Aplicação MVC com AngularJS para consumir um serviço WebApi; Usando JWT para gerar Token que expira em 1 minuto e obter uma lista de produtos.
O projeto consiste em uma aplicaçao SPA que gera um Token ao logar e exibe uma lista de produtos, consome um serviço Rest com WebApi implementado com as seguintes considerações:
	 - Uma tela de login, para se autenticar em uma api que retornará um token.
	 - Uma tela que irá fazer uma listagem de produtos, esta tela só pode ser acessada se o usuário tiver o token de autenticação, 
	 - A listagem deverá vir da api que vai receber e validar o token antes de devolver a listagem.
	 - Caso o token esteja expirado deverá ser redirecionado para a tela de login.
	 - O token expira em 1 minuto.
# Getting Started
TPacotes instalados com o Nuget no projeto MVC 
angularjs 1.6.5
toastr

No layout adicionou a referencia para as classes js do angularjs e toastr;
No Body de _Layout foi incluído a tag 'ng-app' do angular especificando o nome para módulo;
Criado uma classe javascript para criar as configurações, constantes, controller,factory.



Criação do módulo geral do sistema
var appAngular = angular.module('FCamara', ['ngRoute']);
Rotas para as URL
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

variável global para o caminho do serviço, deve ser adicionado a url do servico que será consumido, no exemplo a URL é 'http://localhost:56085'
appAngular.constant('serviceBasePath', 'http://localhost:56085');
 
Controler utilizado, deve ser o mesmo nome que será utilizado pela view, no exemplo 'HomeController'. inclusão tbm de diretivas do angula e de factories criadas para a funcionalidade, 
a exemplo do 'dataService', accountService.
appAngular.controller('HomeController', ['$scope', '$http', 'dataService', 'accountService', '$location', function ($scope, $http, dataService, accountService, $location) {
    $scope.data = "";
[...]
}]);

factory  'dataService' usada para consumir o serviço para listar os produtos.
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

//Factory para executar o login e gerar o token.
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
   
Intercepta o retorno do servidor, verificando em cada solicitação se o token expirou.

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
 
# Build and Test
Após baixar o projeto deve informar o URL do servidor que será consumido na classe javascript.
Com o servidor em execução informe um usuário válido,  Login: Admin senha: admin.
Pode Atualizar a pagina (F5) ou acionar o botão atualizar para verificar se o token expirou.


# Contribute
https://angularjs.org/
http://onehungrymind.com/winning-http-interceptors-angularjs/
https://cezarcruz.com.br/como-utilizar-o-http-interceptor-do-angular-js/#Testes
https://rafaell-lycan.com/2016/autenticacao-jwt-angular-app/

If you want to learn more about creating good readme files then refer the following [guidelines](https://www.visualstudio.com/en-us/docs/git/create-a-readme). You can also seek inspiration from the below readme files:
- [ASP.NET Core](https://github.com/aspnet/Home)
- [Visual Studio Code](https://github.com/Microsoft/vscode)
- [Chakra Core](https://github.com/Microsoft/ChakraCore)
