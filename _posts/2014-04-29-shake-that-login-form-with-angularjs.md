---
layout: post
description:
  Learn how to build an HTML5 form with a CSS3 animated shake effect and AngularJS
  similar to the OS X login mask
title: Shake that login form with AngularJS
---

You might have read the excellent post [Improve the payment experience with animations](https://medium.com/ui-ux-articles/3d1b0a9b810e).
I really liked the shake effect for the payment form.

![stripe payment form shake](https://raw.githubusercontent.com/zeMirco/ng-form-shake/master/img/stripe.gif)

If it reminds you of the OS X login mask you're probably not the only one.

![os x login mask](https://raw.githubusercontent.com/zeMirco/ng-form-shake/master/img/osx.gif)

So I thought "Let's build this with AngularJS!". Here is a quick preview of the
final result.

![angularjs login form shake](https://raw.githubusercontent.com/zeMirco/ng-form-shake/master/img/demo.gif)

First of all it only works with the latest version of AngularJS (1.3.x). That's
because 1.3.x comes with a new directive called [ngModelOptions](https://docs.angularjs.org/api/ng/directive/ngModelOptions).
It basically defers the update on a model for some time or until a certain event
is fired. That's pretty useful because we don't want model updates to happen while
the user types `email` and `password`. The model updates happen on the `blur` event, i.e.
as soon as the input fields lose focus.

I've created a custom directive `shakeThat` which has two scope variables. The first one
`submit` calls the parent controller function `submit()` when the form is valid.
The second one `submitted` is a Boolean value and `false` at the beginning. It simply
defers the activation of error classes until the user clicks on the 'Login' button.
Check out [AngularJS Form Validation](http://scotch.io/tutorials/javascript/angularjs-form-validation#only-showing-errors-after-submitting-the-form)
for more information about the `submitted` variable.

Here is some minimal HTML that shows how to use the directive.

```html
<form name="form" shake-that submitted="submitted" submit="submit()">
    <div class="form-group" ng-class="{'has-error': form.email.$invalid && submitted}">
      <label for="email" class="control-label">Email</label>
      <input
        type="email"
        class="form-control"
        id="email"
        name="email"
        placeholder="Email"
        ng-model="email"
        ng-model-options="{updateOn: 'blur'}"
        required>
    </div>
    <div class="form-group" ng-class="{'has-error': form.password.$invalid && submitted}">
      <label for="password" class="control-label">Password</label>
      <input
        type="password"
        class="form-control"
        id="password"
        name="password"
        placeholder="Password"
        ng-model="password"
        ng-model-options="{updateOn: 'blur'}"
        required>
    </div>
    <button type="submit" class="btn btn-primary btn-block">Login</button>
</form>
```

My `app.js` code.

```js
angular.module('app', ['ngAnimate'])

.controller('FormCtrl', ['$scope', function($scope) {
  // hide error messages until 'submit' event
  $scope.submitted = false;
  // hide success message
  $scope.showMessage = false;
  // method called from shakeThat directive
  $scope.submit = function() {
    // show success message
    $scope.showMessage = true;
  };
}])

.directive('shakeThat', ['$animate', function($animate) {

  return {
    require: '^form',
    scope: {
      submit: '&',
      submitted: '='
    },
    link: function(scope, element, attrs, form) {
      // listen on submit event
      element.on('submit', function() {
        // tell angular to update scope
        scope.$apply(function() {
          // everything ok -> call submit fn from controller
          if (form.$valid) return scope.submit();
          // show error messages on submit
          scope.submitted = true;
          // shake that form
          $animate.addClass(element, 'shake', function() {
            $animate.removeClass(element, 'shake');
          });
        });
      });
    }
  };

}]);
```

And the necessary CSS styles (same as [stripe checkout](https://stripe.com/docs/checkout)).

```css
@keyframes shake {
  0% {transform: translateX(0);}
  12.5% {transform: translateX(-6px) rotateY(-5deg)}
  37.5% {transform: translateX(5px) rotateY(4deg)}
  62.5% {transform: translateX(-3px) rotateY(-2deg)}
  87.5% {transform: translateX(2px) rotateY(1deg)}
  100% {transform: translateX(0)}
}

.shake {
  animation: shake 400ms ease-in-out;
}
```

Inside my `shakeThat` directive I use the `$animate` service to add and remove
the `shake` class from the form. Whenever it was added I also have to remove it again
to make the form shake on every new invalid input. Without removing the `shake` class
at the end the form would only shake once. So I took the `addClass` callback function
which respects our animation timing (400ms from our CSS file) and as soon as the animation is
over the `shake` class is removed from the form.

One tricky part is accessing the form controller within my custom directive using
isolated scope. Luckily other people had this problem before and I found a detailed
answer on Stack Overflow [Pass form to directive](http://stackoverflow.com/a/17621174/1256496).
Here is how it works.

```js
  return {
    require: '^form',
    link: function(scope, element, attrs, form) {
      console.log(form.$valid) // false
    }
  };
```

As you can see `require: '^form'` gives us a fourth parameter in our linking function.
From here we can use all features (`$valid`, `$pristine`, `form.INPUT.$error`, etc.) as if we were in our parent controller.

Another stupid problem I had was that the `submitted` variable wasn't updated immediately
but only after I've made some changes to the input values. Simply wrapping everything
into `scope.$apply(function() {})` solved this problem. Pretty obvious after all but I
somehow thought `element.on()` wouldn't lose scope since it's a built-in AngularJS feature.

The whole code with some more bits and pieces is on GitHub [ng-form-shake](). If you have any issues or
improvements let me know. There is also a [live demo](http://zemirco.github.io/ng-form-shake).
