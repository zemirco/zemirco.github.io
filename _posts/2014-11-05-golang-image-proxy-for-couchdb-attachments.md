---
layout: post
description:
  Use Golang's ReverseProxy to write a streaming image proxy for CouchDB document attachments
title: Golang image proxy for CouchDB attachments
---

Suppose you have several CouchDB documents and each document has an image attachment named `photo.jpg`.

```json
{
  "_id": "270555B1-457C-4217-ACBE-2FB2D0F9F72D",
  "_rev": "2-07c55308c85ac1c3646837ded7f3a076",
  "name": "John",
  "_attachments": {
    "photo.jpg": {
      "content_type": "image/jpeg",
      "revpos": 2,
      "digest": "md5-zAkJYvzxNOW+VdOLMHxIiA==",
      "length": 353828,
      "stub": true
    }
  }
}
```

You'd like to show all your documents as a list in the browser and alongside the image for each document. However your CouchDB uses Basic Authentication and you cannot access file attachments directly from the client as everybody would see your username and password.

{% raw %}
```html
<td>
  <img src="http://user:pass@127.0.0.1:5984/db/{{player._id}}/photo.jpg" />
  {{player.name}}
</td>
```
{% endraw %}

You need a proxy that takes incoming requests from the browser, rewrites the URL to point to your CouchDB and pipes the response from your database back to the client. Luckily Go has [ReverseProxy](http://golang.org/pkg/net/http/httputil/#ReverseProxy).

First you need to define a route for images. I'm using [Gorilla mux](http://www.gorillatoolkit.org/pkg/mux) as my router.

```go
func main() {
	router := mux.NewRouter()
	router.HandleFunc("/image/{id}/name/{name}", handler).Methods("GET")
	http.Handle("/", router)
	http.ListenAndServe(":8000", nil)
}
```

Then inside the `handler` function we create our proxy.

```go
// GET /image/{id}/name/{name}
func handler(w http.ResponseWriter, r *http.Request) {
  vars := mux.Vars(r)
  id := vars["id"]
  name := vars["name"]

  uri := fmt.Sprintf("http://user:pass@127.0.0.1:5984/db/%s/%s", id, name)
  u, err := url.Parse(uri)
  if err != nil {
    panic(err)
  }
  director := func(request *http.Request) {
    request.URL = u
  }
  proxy := &httputil.ReverseProxy{Director: director}
  proxy.ServeHTTP(w, r)
}
```

We have to create our own `Director` as Go's [default configuration](http://golang.org/pkg/net/http/httputil/#NewSingleHostReverseProxy) doesn't work in this case.

> If the target's path is "/base" and the incoming request was for "/dir", the target request will be for /base/dir.

In other words if we wouldn't use our own director and make a request to `/image/abc123/name/photo.jpg` Go would simply append it to the target URL and the final request would be wrong `/db/abc123/photo.jpg/image/abc123/name/photo.jpg`.

```json
{
  "error":"not_found",
  "reason":"Document is missing attachment"
}
```

Our custom director always uses the URL we've created before by taking our CouchDB URL and passing in document ID and attachment name. We can now use our proxy from the client without exposing `username` and `password`. `ReverseProxy` also takes care of all request and response headers so caching works without any additional work.

{% raw %}
```html
<td>
  <img src="/image/{{player._id}}/name/photo.jpg" />
  {{player.name}}
</td>
```
{% endraw %}
