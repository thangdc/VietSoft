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

app.factory('Ratings', function ($window, $firebase, FIREBASE_URL) {
	var ref = new $window.Firebase(FIREBASE_URL);
	var Ratings = {
		GetAllRatings: function(name){
			return $firebase(ref.child('ratings').child(name)).$asArray();	
		},
		SetRatings: function(name, ip, value){
			ref.child('ratings').child(name).set({ ip.relace(/\./g, '_'): value });
		},
		GetRatings: function(name, ip){
			return ref.child('ratings').child(name).child(ip.replace(/\./, '_'));
		}
	};
	return Ratings;
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

app.factory('Tracking', function ($window, FIREBASE_URL, $firebase, $http) {
	var ref = new $window.Firebase(FIREBASE_URL);
	var tracking = {
		Save: function(path){
			$http.jsonp('http://ipinfo.io/?callback=JSON_CALLBACK').success(function(data) {
				data.path = path;
				ref.child('tracking').push(data);
			});
		}
	};
	return tracking;
});

app.factory('Main', function (){
	var result = {
		Navigation: function(path){
			var nav = [
				{ Title: 'Trang chủ', Link: '/', Target: '', Active: path === "/" ? true : false },
				{ Title: 'Dịch vụ', Link: 'services.html', Target: '', Active: path === "/services.html" ? true : false },
				{ Title: 'Dự án', Link: 'projects.html', Target: '', Active: path === "/projects.html" ? true : false },
				{ Title: 'Blog', Link: 'http://www.thangdc.com', Target: '_blank', Active: path === "http://www.thangdc.com" ? true : false },
				{ Title: 'Tạo QR Code', Link: '/qr-code-generator.html', Target: '', Active: path === "/qr-code-generator.html" ? true : false },
				{ Title: 'Liên hệ', Link: 'contact.html', Target: '', Active: path === "/contact.html" ? true : false }
			];
			return nav;
		},
		Footer: function(path){
			var nav = [
				{ Title: 'Điều khoản sử dụng', Link: 'terms.html', Target: '', Active: path === "/terms.html" ? true : false, Minus: '-' },
				{ Title: 'Chính sách', Link: 'policy.html', Target: '', Active: path === "/policy.html" ? true : false, Minus: '-' },
				{ Title: 'Câu hỏi thường gặp', Link: 'FAQs.html', Target: '', Active: path === "/FAQs.html" ? true : false, Minus: '-' },
				{ Title: 'Về chúng tôi', Link: 'about-vietsofts.html', Target: '', Active: path === "/about-vietsofts.html" ? true : false, Minus: '-' },
				{ Title: 'Sitemap', Link: 'sitemap.html', Target: '', Active: path === "/sitemap.html" ? true : false, Minus: '' }
			];
			return nav;
		}
	};
	return result;
});
