---
layout: post
description:
  Add cross-site request forgery (CSRF or XSRF) protection to your Express and AngularJS app.
  Use a middleware on the server to send the token automatically and read it back from incoming requests.
title: Using CSRF protection with Express and AngularJS
---

In this post I'll demonstrate how to use CSRF protection for Express and AngularJS apps. Both frameworks have CSRF protection
built in but don't understand each other without manual adjustments.

Express is built on top of the [connect](http://www.senchalabs.org/connect/) framework which has a native [csrf](http://www.senchalabs.org/connect/csrf.html) middleware. It generates a random string token
that is unique for each user. The token is saved in the user's session on the server. On every request which mutates state,
usually `PUT`, `POST` and `DELETE` requests, the middleware validates whether the CSRF token sent from the client is the
same as the token stored in the user's session on the server. If it isn't the client gets the answer `403 Forbidden`. The following is taken from the docs and describes where the middleware is looking for the token.

> The default value function checks req.body generated by the bodyParser() middleware, req.query generated by query(), and the "X-CSRF-Token" header field.

AngularJS also has CSRF features built into its $http service.

> When performing XHR requests, the $http service reads a token from a cookie called XSRF-TOKEN and sets it as the HTTP header X-XSRF-TOKEN

Both frameworks offer CSRF protection. To make them work together we have to make some adjustments. Follow the steps below to make CSRF work for your next app

1. Add CSRF middleware to your Express app
2. Tell the middleware to use the right token
3. Use custom middleware to set a cookie for AngularJS
4. Use AngularJS $http library for XHR requests

### 1. Adding CSRF middleware to an Express app

In the first step we have to add the CSRF middleware to our app. As it requires sessions we also have to 
add some extra session middleware. You don't have to install anything because they come with Express.

```js
app.use(express.cookieParser('your secret here'));
app.use(express.cookieSession());
app.use(express.csrf());
```

### 2. Telling CSRF middleware to use the right token

As mentioned earlier the default CSRF middleware looks in `req.body`, `req.query` and the `X-CSRF-Token` header for the token.
AngularJS uses none of the methods but instead its own header `X-XSRF-TOKEN`. Therefor we have to tell Express where to look
for the token delivered by AngularJS. Create a new function that returns this token from the `request` object.

```js
var csrfValue = function(req) {
  var token = (req.body && req.body._csrf)
    || (req.query && req.query._csrf)
    || (req.headers['x-csrf-token'])
    || (req.headers['x-xsrf-token']);
  return token;
};
```

The function above is the default function taken from connect. I just added the last line `req.headers['x-xsrf-token']`.
It still accepts the other methods but also finds the incoming token from AngularJS. Now pass this function to the CSRF middleware from step 1.

```js
app.use(express.csrf({value: csrfValue}));
```

Cool, Express can now find the token sent by AngularJS. One thing that is missing is sending the token from our Express server
to our AngularJS client.

### 3. Using custom middleware to set a cookie for AngularJS

AngularJS's $http library reads the token from the `XSRF-TOKEN` cookie. We therefore have to set this cookie and send it to 
the client. Setting a cookie in Express is done via the `res.cookie('name', 'value')` function. The name is obviously `XSRF-TOKEN`.
The value is read from the user's session. The key `req.session._csrf` is automatically generated by the csrf middleware. 

```js
app.use(function(req, res, next) {
  res.cookie('XSRF-TOKEN', req.session._csrf);
  next();
});
```

### 4. Using AngularJS $http library for XHR requests

We now have everything in place to use AngularJS's $http library without further adjustments. A simple
controller could look like the following

```js
var myApp = angular.module('myApp',[]);

myApp.controller('csrfCtrl', ['$scope', '$http', function($scope, $http) { 
      
  $scope.submit = function() {
    
    $http.post('/', {value: $scope.value})
      .success(function(data) {
        $scope.answer = data
      })
      .error(function() {
        console.log('err')
      })
    
  }
  
}]);
```

No adjustments are need on the client and your code should work as is.

![CSRF example for Express and AngularJS](https://s3.amazonaws.com/mircozeiss.com/csrf-express-angular.png)

### Conclusion

As you've seen adding CSRF protection to an app built with Express and AngularJS is really simple. There shouldn't be
any reason not to use this technique for your next app. It adds another layer of security. The underlying principles can also
be applied to apps built with a different stack. Reading their documentations is always a good start.

You can find the code at GitHub [zeMirco/csrf-express-angular](https://github.com/zeMirco/csrf-express-angular) and a running example at Heroku [http://arcane-headland-6078.herokuapp.com/](http://arcane-headland-6078.herokuapp.com/).