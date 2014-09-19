---
layout: post
description:
  Up-to-date tutorial for hosting a Golang application on Digital Ocean.
  It includes Dokku for git push deployment.
title: Host your Golang app on Digital Ocean with Dokku
---

Most of the other tutorials and sample GitHub projects you find are outdated.
So here is how to setup Dokku on Digital Ocean to host your Golang apps and deploy
via `git push`.

First of all you need an account for
[Digital Ocean](https://www.digitalocean.com/?refcode=77a9b70b9c31) (referral link).
Create a new droplet. Linux distribution is **Ubuntu 14.04 x64** and application is
**Dokku v0.2.3 on Ubuntu 14.04 (w/ Docker 1.1.2)**. Wait for Digital Ocean
to create your droplet and then visit the IP in your browser.
Paste your public SSH key ([Guide](https://www.digitalocean.com/community/tutorials/how-to-use-ssh-keys-with-digitalocean-droplets)) into the input field and click on "Finish Setup".
You don't have to change anything in the section "Hostname configuration".

Create an `app.go` file on your local computer and start with a simple web server.

```go
package main

import (
  "fmt"
  "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
  fmt.Fprintf(w, "Hi there, I love %s!", r.URL.Path[1:])
}

func main() {
  http.HandleFunc("/", handler)
  http.ListenAndServe(":8080", nil)
}
```

To make sure your code works run the server
and visit [localhost:8080/](http://localhost:8080) in your browser.

```bash
$ go run app.go
```

On Digital Ocean you cannot use a static port like `:8080`.
Import package `"os"` and change the last line in `func main() {}`.

```go
import (
  "fmt"
  "net/http"
  "os"
)

// func handler ...

func main() {
  http.HandleFunc("/", handler)
  http.ListenAndServe(":"+os.Getenv("PORT"), nil)
}
```

In order to start the server locally you have to set an environment variable.

```bash
$ PORT=8080 go run app.go
```

Next tell Dokku which file to start after deployment. Create a file named `Procfile`
and add the following content.

```
web: web
```

**Important:** At first I thought you have to add the file name, `app.go` in our case,
but make sure you use your **project folder name**! My project lives in the `web` folder
and therefore I added `web` after the colon.

So far so good. Initialize git, add `app.go` and `Procfile`, add
the remote repository and push to production. Replace the IP with your droplet IP.

```bash
$ git init
$ git add .
$ git commit -m "init"
$ git remote add ocean dokku@104.131.51.87:app
$ git push ocean master
```

You might see a message like this.

```
The authenticity of host '104.131.51.87 (104.131.51.87)' can't be established.
RSA key fingerprint is XX:XX:XX:XX... .
Are you sure you want to continue connecting (yes/no)?
```

Write `yes` and hit Enter. Git will push your code to the server and Dokku will
start deploying your app. Unfortunately you'll see an error.

```
Go app detected
remote:  !     A .godir is required. For instructions:
remote:  !     http://mmcgrana.github.io/2012/09/getting-started-with-go-on-heroku
```

Don't follow this link. A `.godir` is not required anymore. Instead we'll use
[godep](https://github.com/tools/godep). Install the tool.

 ```
 $ go get github.com/tools/godep
 ```

Then on your local computer inside your app folder create the dependencies
for your project.

```
$ godep save
```

Add the new `Godeps/` folder to the git repository and deploy to the server.

```bash
$ git add .
$ git commit -m "add dependencies"
$ git push ocean master
```

Congratulations, you did it!

```bash
=====> Application deployed:
       http://104.131.51.87:49153
```

Remember to always run `godep save` whenever you import new packages.

You can check that you've got the right content in your `Procfile` by comparing
it with your `Godeps/Godeps.json` file. The last part of `ImportPath` has the same
name.

```json
{
	"ImportPath": "github.com/zemirco/web",
	"GoVersion": "go1.3.1",
	"Deps": []
}
```
