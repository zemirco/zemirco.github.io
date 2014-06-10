---
layout: post
description: If you know JavaScript here is how to develop in Swift
title: Swift for JavaScript developers
---

Let's have a look at Swift from a JavaScript developer's view. I'll take a look at Classes, Callbacks,
Events, Truthy / Falsy and Generics and compare the JS implementation to the Swift
implementation.

## Classes

You're probably familiar with Classes in JavaScript that use the `prototype`
property.

```js
var Person = function(name) {
  this.name = name;
}

Person.prototype.speak = function() {
  return 'Hey there, my name is ' + this.name;
}

var me = new Person('Mirco');
me.speak();
// Hey there, my name is Mirco
```

In ECMAScript 6 the same code could be rewritten using proper classes.

```js
class Person {

  constructor(name) {
    this.name = name;
  }

  speak() {
    return `Hey there, my name is ${this.name}`;
  }

}

var me = new Person('Mirco');
me.speak();
// Hey there, my name is Mirco
```

The same code in Swift looks really similar.

```
class Person {

  var name: String

  init(name: String) {
    self.name = name
  }

  func speak() -> String {
    return "Hey there, my name is \(self.name)"
  }

}

var me = Person(name: "Mirco")
me.speak()
// Hey there, my name is Mirco
```

So nothing new here. If you're familiar with Object-Oriented Programming you won't have
any problems.

## Callbacks

Callbacks in Swift are called
[Closures](https://developer.apple.com/library/prerelease/ios/documentation/swift/conceptual/swift_programming_language/Closures.html#//apple_ref/doc/uid/TP40014097-CH11-XID_117).
Take the following asynchronous code that uses Callbacks.

```js
var log = function(txt, done) {
  setTimeout(function() {
    console.log('callbacks are ' + txt);
    done();
  }, 1000)
}

log('awesome', function() {
  console.log('and done');
});
```

As you probably know Callbacks are so 1999 so let's have a look at the same example
using native JavaScript Promises.

```js
var log = function(txt) {
  return new Promise((resolve) => {
    setTimeout(function() {
      console.log('promises are ' + txt);
      resolve();
    }, 1000)
  })
}

log('the future').then(() => {
  console.log('and done');
});
```

Now let's marry Callbacks and Promises and we have the Swift code.

```
func log(txt: String, #resolve: () -> (), #reject: () -> ()) {
  var delta: Int64 = 1 * Int64(NSEC_PER_SEC)
  var time = dispatch_time(DISPATCH_TIME_NOW, delta)

  dispatch_after(time, dispatch_get_main_queue(), {
    println("closures are " + txt)
    resolve()
  });
}

log("not the same as JS closures",
  resolve: {
    println("and done")
  },
  reject: {
    // handle errors
  })
```

The function parameters don't have to be called `resolve` and `reject`.
You could also name them `success` and `failure`.

Closures are a bit tricky because we also have them in JavaScript. They are
kind of similar but not the same. We have to get used to the wording.

## Events

JavaScript is all about Events. Button clicks, window scrolling, blurring input
fields, etc. They are very easy to implement with jQuery.

```js
$('.btn').click(function() {
  console.log('button clicked');
});
```

Or with native JavaScript.

```js
var btn = document.getElementById('btn');
btn.addEventListener('click', function() {
  console.log('button clicked');
});
```

Swift uses the
[Target-Action](https://developer.apple.com/library/ios/documentation/general/conceptual/CocoaEncyclopedia/Target-Action/Target-Action.html#//apple_ref/doc/uid/TP40010810-CH12-SW44)
mechanism.

```
// get reference to text field
@IBOutlet var txt : UITextField

// add event listener
txt.addTarget(self, action: Selector("updated"), forControlEvents: UIControlEvents.ValueChanged)

// handle the event
func updated() {
  println("the new value is \(txt.text)")
}
```

Events and Target-Action are very similar. You have an Object, add an EventListener and write
a Function that handles the event.

## Truthy and Falsy

Using truthy and falsy values in JavaScript makes your code much simpler and easier
to read.

```js
var txt = '';

if (!txt) {
  console.log('we have no text');
}
```

In the above example we'd actually get `'we have no text'` because `txt` is an empty
String and empty Strings are falsy. Compare this with a more verbose example that
gives the same result.

```js
var txt = '';

if (txt === '' || txt === undefined || txt === null) {
  console.log('we have no text');
}
```

Swift uses optional variables that are similar to Truthyness and Falsyness.

```
var error: NSError?

if let desc = error.description {
    println("oh noes we have an error \(desc)")
}
```

Again very similar to JavaScript where you can simply check for the existence of a
Variable.

## Generics

In JavaScript you can write an `add` function which simply adds two arguments.

```js
function add(a, b) {
  return a+b;
}

add(2, 3);
// 5
add('hello', ' world!');
// hello world!
```

That doesn't work in Swift since Swift has
[Types](https://developer.apple.com/library/prerelease/ios/documentation/Swift/Conceptual/Swift_Programming_Language/Types.html#//apple_ref/doc/uid/TP40014097-CH31-XID_988).
You have to specify the parameter type when you define your function.

```
func add(a: Int, b: Int) -> Int {
  return a+b
}

add(2, 3)
// 5
add("hello", " world!")
// Cannot convert the expression's type 'Int' to type 'Int'
```

You'd have to write another function `add` which accepts Strings. And another one
which uses Floats. And another for Doubles. But that's pretty stupid so Swift
uses
[Generics](https://developer.apple.com/library/prerelease/ios/documentation/swift/conceptual/swift_programming_language/Generics.html).
With Generics you can write your function only once and call it with different parameter
types.

```
func add<T>(a: T, b: T) {
  println(a + b)
}

add(2, 3)
// 5
add("hello", " world!")
// Could not find an overload for '+' that accepts the supplied arguments
```

OK, as you can see it is not that easy. We have to tell Swift what Types can be
connected (or added) via the `+` operator. First we have to implement a new protocol.
Swift currently has
[three built-in protocols](https://developer.apple.com/library/prerelease/ios/documentation/General/Reference/SwiftStandardLibraryReference/Equatable.html#//apple_ref/doc/uid/TP40014608-CH17-SW1):
Equatable, Comparable and Printable.
Let's create another one called `Addable`.

```
protocol Addable {
    func +(left: Self, right: Self) -> Self
}
```

Second we have to teach Swift that the Types `String` and `Int` are addable.

```
extension Int: Addable {}
extension String: Addable {}
```

And last but not least we have to use our new Protocol in our `add` function.

```
func add<T: Addable>(a: T, b: T) -> T {
  return a + b
}

add(2, 3)
// 5
add("hello", " world!")
// hello world!
```

Generics is probably the hardest feature to wrap your head around. Just play around
with them and you'll understand them and their power pretty quickly.

## Conclusion

Swift is a game changer for iOS development. It lures a whole new audience into
programming apps for Apple. I was a big fan of Hybrid Apps using technologies like
[AngularJS](https://angularjs.org/),
[Ionic Framework](http://ionicframework.com/) and
[PhoneGap](http://phonegap.com/)
but now that I've seen the power and simplicity
of developing code with Xcode I'm afraid I have to say that Hybrid Apps will have an even
harder future competing with Swift.
