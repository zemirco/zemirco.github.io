---
layout: post
description: 
  With version 0.5.0 Lockit handles authentication for single page apps.
  Optional CSRF support are also included and tests were refactored.
title: Lockit 0.5.0 - Authentication for SPAs and CSRF support
---

[Lockit](https://github.com/zeMirco/lockit) 0.5.0 is out and I've added two new features.

1. Authentication for single page applications (SPAs)
2. CSRF support

## Authentication for single page applications

In a SPA all the routing and template rendering is done on the client.
Before version 0.5.0 Lockit caught relevant routes, like `/login` or `/signup`,
and did the entire rendering on the server.

Starting with version 0.5.0 you're able to use Lockit as a REST API and communicate via JSON.
All you have to do is setting `exports.rest = true` in your `config.js`.

With REST enabled all default routes get a `/rest` prefix so you can catch `/login`
on the client. To allow for true page refreshes (i.e. user is at `/login` and refreshes the page)
all routes on the server, like `/login` and `/signup`, send the `index.html` from the `public/`
folder. From there your SPA has to take over.

Here is a short example how the process works.

1. User sends GET request for `/login`
2. Server has a route handler for this request and sends `index.html` back
3. Client router takes over and renders `/login` page
4. User enters credentials and submits the form
5. Client controller catches submit and sends POST request to `/rest/login`
6. Server handles POST request and validates user credentials
7. Server sends status code `200` or some JSON with error message
8. Client reacts to JSON from server and redirects on success or shows error

I've built a [simple example](https://github.com/zeMirco/lockit/tree/master/examples/angular) 
using AngularJS on the client side.

## CSRF support

All default views that come with Lockit and mutate state on the server
now have a hidden input field.

```html
<input type="hidden" name="_csrf" value=_csrf>
```

If you use your own custom views and you use CSRF protection on the server you must
include this hidden field as well.

In your Express app you activate CSRF protection by using [the csrf connect middleware](http://www.senchalabs.org/connect/csrf.html).

```js
app.use(express.csrf());
app.use(function(req, res, next) {
  var token = req.csrfToken();
  res.locals._csrf = token;
  next();
});
```

Here we include the `csrf` middleware and write a tiny custom middleware.
Our custom middleware gets the token from `express.csrf()` and sets the value to a local
variable named `_csrf`. This local variable is then used in our view. If you don't use
CSRF protection the view will simply ignore the hidden input field.

With SPAs the implementation is a bit different. Since we don't render the template on the server
we cannot inject any variables directly into the view. We have to find another way
to send the token to our client.

We do this by setting a cookie which is automatically read from AngularJS [$http service](http://docs.angularjs.org/api/ng.$http)
and included in the subsequent request headers. For more information see [my older post](http://mircozeiss.com/using-csrf-with-express-and-angular/).
The overall implementation is still the same but some minor things might have changed.

```js
app.use(express.csrf());
app.use(function(req, res, next) {
  var token = req.csrfToken();
  res.cookie('XSRF-TOKEN', token);
  next();
});
```

## Conclusion

Lockit is slowly but steadily growing and I'm getting good feedback from the community.
Test the new version and leave your comments and issues at [GitHub](https://github.com/zeMirco/lockit).