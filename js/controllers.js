var app = angular.module('vietsofts.controllers', []);

app.controller('AuthCtrl', function ($scope, $location, Auth, user) {
	if (Auth.signedIn()) {
		$location.path('/');
    }

	$scope.login = function () {
		Auth.login($scope.user).then(function () {
			$location.path('/');
		}, function (error) {
			$scope.errorMsg = error.toString();
		});
	};

	$scope.register = function () {
		Auth.register($scope.user).then(function(user) {
			return Auth.login($scope.user).then(function() {
				user.userName = $scope.user.userName;
				return Auth.createProfile(user);
			}).then(function() {
				$location.path('/');
			});
		}, function(error) {
			$scope.errorMsg = error.toString();
		});
	};
});

app.controller('ProfileCtrl', function ($scope, $routeParams, Auth, Profile, Post) {
	
	$scope.user = Auth.user;
	
	var uid = $routeParams.userId;
	$scope.profile = Profile.get(uid);
	
	Profile.getPosts(uid).then(function(posts) {
		$scope.posts = posts;
	});
	
	$scope.deletePost = function (post) {
		Post.delete(post);
	};
});

app.controller('PostsCtrl', function ($scope, $location, Auth, Post, Helper) {
	
	$scope.user = Auth.user;
	$scope.posts = Post.all;
	
	$scope.signedIn = Auth.signedIn;
	$scope.post = {content: '', title: ''};

	$scope.submitPost = function () {
		$scope.post.creator = $scope.user.profile.userName;
		$scope.post.creatorUID = $scope.user.uid;
		$scope.post.createDate = Helper.formatDate(new Date());
        	var content = $scope.post.content;
        	$scope.post.content = content.replace(/\n/g, '<br/>');
        	if(!$scope.post.picture){
        		$scope.post.picture = 'images/Home.png';	
        	}
		Post.create($scope.post).then(function () {
			$scope.post = {content: '', title: '', picture: ''};
			$('#list').html('');
			$location.path('/posts');
		});
	};
	
	$scope.deletePost = function (post) {
		Post.delete(post);
	};

    $scope.like = function(post){
        
    }

    $scope.upload = function(){
        $('#picture').click();
    }

    document.getElementById('picture').addEventListener('change', function(evt){
        var files = evt.target.files;
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                var span = document.createElement('span');
                span.innerHTML = ['<img class="thumb" src="', e.target.result,
                                '" title="', escape(theFile.name), '" style="height: 75px;"/>'].join('');
                $scope.post.picture = e.target.result;
                $('#list').html(span);
            };
        })(files[0]);
        reader.readAsDataURL(files[0]);
    }, false);

    $(window).scroll(function() { 
        if (window.scrollY == document.body.scrollHeight - window.innerHeight) {
            /*var item = $scope.posts;
            var id = item[item.length -1].$id;
            var data = Post.loadMore(id);
            console.log(data);*/
        }  
    });
});


app.controller('PostViewCtrl', function ($scope, $routeParams, Post, Auth, Helper) {
	$scope.post = Post.get($routeParams.postId);
	$scope.comments = Post.comments($routeParams.postId);

	$scope.user = Auth.user;
	$scope.signedIn = Auth.signedIn;

	$scope.addComment = function () {
		if(!$scope.commentText || $scope.commentText === '') {
			return;
		}

		var comment = {
			text: $scope.commentText,
			creator: $scope.user.profile.userName,
			creatorUID: $scope.user.uid,
			createDate: Helper.formatDate(new Date())
		};
		
		$scope.comments.$add(comment);
		$scope.commentText = '';
	};

	$scope.deleteComment = function (comment) {
		$scope.comments.$remove(comment);
	};
});

app.controller('NavCtrl', function ($scope, Auth, $location, Post, Helper) {
	$scope.user = Auth.user;
	$scope.signedIn = Auth.signedIn;
	$scope.logout = Auth.logout;
});

app.controller('MainCtrl', function($scope, $location, Tracking, Main){
	//Tracking.Save();
	$scope.navigation = Main.GetNavigation($location.path());
});
