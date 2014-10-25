var app = angular.module('vietsofts.services', []);
app.value('FIREBASE_URL', 'https://vietsofts.firebaseio.com/');

app.factory('Auth', function ($firebaseSimpleLogin, $firebase, FIREBASE_URL, $rootScope) {
	var ref = new Firebase(FIREBASE_URL);
	var auth = $firebaseSimpleLogin(ref);

	var Auth = {
		register: function (user) {
		  return auth.$createUser(user.email, user.password);
		},
		login: function (user) {
		  return auth.$login('password', user);
		},
		logout: function () {
		  auth.$logout();
		},
		resolveUser: function() {
		  return auth.$getCurrentUser();
		},
		signedIn: function() {
		  return !!Auth.user.provider;
		},
		createProfile: function (user) {
		  var profile = {
			userName: user.userName,
			md5_hash: user.md5_hash
		  };

		  var profileRef = $firebase(ref.child('users').child(user.uid).child('profile'));
		  return profileRef.$set(profile);
		},
		user: {}
	};

	$rootScope.$on('$firebaseSimpleLogin:login', function(e, user) {
		angular.copy(user, Auth.user);
		Auth.user.profile = $firebase(ref.child('users').child(user.uid).child('profile')).$asObject();
	});
  
	$rootScope.$on('$firebaseSimpleLogin:logout', function() {
		if(Auth.user && Auth.user.profile) {
			Auth.user.profile.$destroy();
		}
		angular.copy({}, Auth.user);
	});

  return Auth;
});

app.factory('Post', function ($window, $firebase, FIREBASE_URL) {
	var ref = new $window.Firebase(FIREBASE_URL);
	var posts = $firebase(ref.child('posts').limit(10)).$asArray();
	
	var Post = {
		all: posts,
        loadMore: function(id){
            return $firebase(ref.child('posts').startAt(null, id).limit(10)).$asArray();
        },
		create: function (post) {
			return posts.$add(post).then(function(postRef) {
				$firebase(ref.child('user_posts').child(post.creatorUID)).$push(postRef.name());
				return postRef;
			});
		},
		get: function (postId) {
			return $firebase(ref.child('posts').child(postId)).$asObject();
		},
		delete: function (post) {
			this.remove_user_post(post);
			this.remove_post_comments(post);
			return posts.$remove(post);
		},
		comments: function (postId) {
			return $firebase(ref.child('comments').child(postId)).$asArray();
		},
		remove_user_post: function(post){
			$firebase(ref.child('user_posts').child(post.creatorUID))
			.$asArray()
			.$loaded()
			.then(function(data) {
				for(var i = 0; i< data.length; i++) {
					var value = data[i].$value;
					if(value == post.$id){
						data.$remove(data[i]);
						break;
					}
				}
			});
		},
		remove_post_comments: function(post){
			$firebase(ref.child('comments').child(post.$id))
			.$asArray()
			.$loaded()
			.then(function(data) {
				for(var i = 0; i< data.length; i++) {
					data.$remove(data[i]);
				}
			});
		}
	};

	return Post;
	
});

app.factory('Profile', function ($window, FIREBASE_URL, $firebase, Post, $q) {
	var ref = new $window.Firebase(FIREBASE_URL);

	var profile = {
		get: function (userId) {
			return $firebase(ref.child('users').child(userId).child('profile')).$asObject();
		},
		getPosts: function(userId) {
			var defer = $q.defer();

			$firebase(ref.child('user_posts').child(userId))
			.$asArray()
			.$loaded()
			.then(function(data) {
				var posts = {};

				for(var i = 0; i< data.length; i++) {
					var value = data[i].$value;
					posts[value] = Post.get(value);
				}
				defer.resolve(posts);
			});

			return defer.promise;
		}
	};

	return profile;
	
});

app.factory('Helper', function () {
	
	var helper = {
		formatDate: function(date) {
			var hours = date.getHours();
			var minutes = date.getMinutes();
			var seconds = date.getSeconds();
			
			var ampm = hours >= 12 ? 'pm' : 'am';
			hours = hours % 12;
			hours = hours ? hours : 12; // the hour '0' should be '12'
			minutes = minutes < 10 ? '0' + minutes : minutes;
			seconds = seconds < 10 ? '0' + seconds : seconds;
			var strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
			return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + " " + strTime;
		}
	}
	
	return helper;	
});