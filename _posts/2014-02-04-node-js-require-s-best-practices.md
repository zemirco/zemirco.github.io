---
layout: post
description: Some best practices for working with Node.js and the require() function.
title: Node.js require(s) best practices
---

I have to admit that the title is a bit catchy but I couldn't resist.
I won't talk about Node.js and that it needs some best practices.
Instead let's talk about some best practices when using the `require()` function.

We all know that Node.js is built on modules. We break everything into small
pieces and glue them together to form our application. In that context you might
have heard people talking about the Unix philosophy.

> Write programs that do one thing and do it well. Write programs to work together.

At some point you might have an `app.js` file where you require
ten or more modules. So the header of your main file could look like this.

```js
var express = require('express');
var time = require('moment');
var cont = require('./controllers');
var parse = require('connect').utils.parseUrl;
var fs = require('../common/filesystem');
var data = require('./data/city');
var dir = require('./models');
var http = require('http');
```

Do you think this is easy to read? Neither do I. Therefore let's introduce some best practices.

### Order

Have a consistent order when requiring modules.

1. core modules come first
2. public modules from `npm` / `node_modules` folder come second
3. Your own modules come at the end

```js
// 1. core modules
var fs = require('fs');
var http = require('http');

// 2. public modules from npm
var express = require('express');
var uuid = require('node-uuid');

// 3. your own modules from file
var myMod = require('./mod.js');
```

### Naming

Give variable names that match the module.

```js
// don't
var save = require('./remove');

// do
var remove = require('./remove');
```

### JSON

Include `.json` in filename.

```js
// don't
var data = require('./data');

// do
var data = require('./data.json');
```

### Folder

Append slash when requiring `./FOLDER/index.js`

```js
// don't
var data = require('./data');

// do
var data = require('./data/');
```

### Override core modules

Do not override core modules.

```js
// don't
var fs = require('./fs');

// do
var fs = require('fs');
var myFs = require('./fs');

// or even better
var fs = require('fs');
var myFs = require('./my-fs');
```

### Nested objects

Require module first and then create shortcut.

```js
// don't
var readFile = require('fs').readFile;

// do
var fs = require('fs');
var readFile = fs.readFile;
```

### Conclusion

When we apply all these best practices to our example from the beginning we end up with this.

```js
var http = require('http');

var express = require('express');
var moment = require('moment');
var connect = require('connect');
var parse = connect.utils.parseUrl;

var controllers = require(./controllers);
var models = require(./models/);
var filesystem = require('../common/filesystem');

var data = require('./data/city.json');
```

Don't you think this is much more readable? I have a [GitHub repo](https://github.com/zeMirco/node-require-s--best-practices)
with an example for every best practice. If something is missing or you want to add some
best practices please open an issue or submit a pull request. Let's make our daily work easier.
