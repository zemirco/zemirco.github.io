---
layout: post
description: 
  Use cookie authentication to access CouchDB running in the cloud
  from PouchDB running in the browser on the client.
title: CouchDB security and PouchDB authentication
---

CouchDB and PouchDB gain more and more attraction these days. IBM just acquired Cloudant which
is big news for the CouchDB environment and NoSQL databases in general.

Today I want to focus on security and direct CouchDB access from the client. Accessing CouchDB
without any server or proxy in between saves traffic and makes replication easy as.
However taking a fresh CouchDB installation and exposing it to the Internet without any modifications
is [adventurous](http://couchdb.readthedocs.org/en/latest/intro/security.html).

To be able to access CouchDB directly from PouchDB you'll have to enable CORS.
You also have secure CouchDB so only registered users and
admins are allowed to perform operations. We'll add a regular non-admin user to our db and
finally use this user's cookie in the client with PouchDB 
to create and read documents directly from our db.

## Secure CouchDB

When you use CouchDB initially you are allowed to do
anything you want. So first of all you have to deactivate the admin party. 
Click on the **Fix this** link in the bottom right corner of Futon. 
Enter some admin username and password. 

Great, we now have our superuser. You should be able to see this user in your `_users` db.

Next make sure only registered users can perform operations on your db.

```
[couch_httpd_auth]
require_valid_user = true
```

Without any rights nobody is able to edit docs in your db. Therefore let's add another user.

## Add CouchDB user

This time we will add a non-admin user. 
You would usually do this whenever a new user signs up for you app.
With [nano](https://github.com/dscape/nano) you simply use the `_users` db and `insert` a new document. Make sure this document
has `roles` and `type` keys. 

```js
var nano = require('nano')('http://admin:password@localhost:5984');
var _users = nano.use('_users');

// create a new user
var user = {
  name: 'john',
  password: 'secret',
  roles: [],
  type: 'user'
};

// add dummy user to db
_users.insert(user, 'org.couchdb.user:john', function(err, body) {
  if (err) console.log(err);
  console.log(body);
  // { 
  //   ok: true,
  //   id: 'org.couchdb.user:john',
  //   rev: '1-88146d8127296b34714569043cbac455' 
  // }
});
```

As you can see we've set the `type` to `user` so **john** doesn't have any admin rights.

## Activate CORS

I'm using CouchDB 1.5 and activating CORS can be done in the Configuration or at [_utils/config.html](http://127.0.0.1:5984/_utils/config.html).
Simply edit your config so it looks like this

```
[httpd]
enable_cors = true

[cors]
credentials = true
origins = http://localhost:3000
```

Now you can try to add a document to the db. 
It won't work because the client isn't authenticated yet.

## Make CouchDB accessible from client

Use `nano` to authenticate a user on the server and get back the current session.

```js
nano.auth('john', 'secret', function(err, body, headers) {
  // you'll need the headers object
});
```

The `headers` object looks like this.

```js
{ 
  'set-cookie': [ 'AuthSession=am9objo1MzBEQ0JDMzo7DOo0cjtK5J7HiVwMTvjl3Y7Y_w; Version=1; Path=/; HttpOnly' ],
  date: 'Wed, 26 Feb 2014 11:10:59 GMT',
  'content-type': 'text/plain; charset=utf-8',
  'cache-control': 'must-revalidate',
  'status-code': 200,
  uri: 'http://admin:password@localhost:5984/_session' 
}
```

What we need is the `AuthSession` string in the `set-cookie` value. Use the [cookie](https://github.com/defunctzombie/node-cookie)
module to parse the header string.

```js
var myCookie = cookie.parse(headers['set-cookie'][0]);
console.log(myCookie);
// { 
//   AuthSession: 'am9objo1MzBEQ0JDMzo7DOo0cjtK5J7HiVwMTvjl3Y7Y_w',
//   Version: '1',
//   Path: '/' 
// }
```

We now have a proper cookie object and can access our session id via `myCookie.AuthSession`.
The next step is to send the cookie to the client. Use the `res.cookie()` method and set the cookie
name to `AuthSession`. This is important! It has to be the same name that we got back from CouchDB.
If you use some other name you'll have to set the client request manually.

```js
res.cookie('AuthSession', myCookie.AuthSession);
res.render('index', { title: 'Express' });
```

You are now able to perform operations on your CouchDB, which runs on a different server, directly from
the client without getting any errors.

## Conclusion

I've shown how to activate CouchDB's security features and how to add admins and members.
By activating CORS we enable cross-domain requests. Finally we took the session cookie from CouchDB
and sent it to the client so they can directly talk to each other. That shifts traffic and logic
away from the server.

The whole code is on [GitHub](https://github.com/zeMirco/couchdb-cookie-auth). If you've got any comments, problems or ideas for improvements just
leave a note in the issues.