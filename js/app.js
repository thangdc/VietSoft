var app = angular.module('vietsofts', ['ngRoute', 'ngSanitize', 'firebase', 'vietsofts.controllers', 'vietsofts.services']);
app.config(function($routeProvider, $locationProvider) {
	$routeProvider
	.when('/', {
		controller:'PostsCtrl',
		templateUrl:'views/posts.html'
	})
	.when('/login', {
		controller: 'AuthCtrl',
		templateUrl: 'template/login.html',
		resolve: {
			user: function(Auth) {
			  return Auth.resolveUser();
			}
		}
	})
	.when('/register', {
		controller: 'AuthCtrl',
		templateUrl: 'template/register.html',
		resolve: {
			user: function(Auth) {
			  return Auth.resolveUser();
			}
		}
	})
	.when('/users/:userId', {
		templateUrl: 'views/profile.html',
		controller: 'ProfileCtrl'
	})
	.when('/posts', {
		templateUrl: 'views/posts.html',
		controller: 'PostsCtrl'
    	})
	.when('/posts/:postId', {
		templateUrl: 'views/showpost.html',
		controller: 'PostViewCtrl'
	})
	.otherwise({
		redirectTo:'/'
	});
	
    //$locationProvider.html5Mode(true).hashPrefix('!');
});
