---
layout: post
description:

title: Browser fallback for running PhoneGap camera plugin on localhost
---

The cool thing about PhoneGap is working in an environment that you are used to.
You can work with your usual text editor, the command line and the browser to preview,
test and debug your app running on localhost.

As soon as you start using PhoneGap plugins, like the camera plugin, you are not able
to run your code in the browser anymore. Compiling the app, running it in an emulator
or an actual device and reading logs in the console takes time and debugging is hard.

Wouldn't it be awesome to make the camera plugin work in the browser? So let's take
a look what the [camera plugin](https://github.com/apache/cordova-plugin-camera/blob/dev/doc/index.md) actually does.

Most of the time I set the [destinationType](https://github.com/apache/cordova-plugin-camera/blob/dev/doc/index.md#options)
to `DATA_URL`. That returns an image as base64-encoded string. We therefore
have to find a solution for the browser to upload an image from file and get
it back as a base64-encoded string.

To make a long story short here is the code. Read more about [FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
and [readAsDataURL](https://developer.mozilla.org/en-US/docs/Web/API/FileReader.readAsDataURL).

```js
// create file input without appending to DOM
var fileInput = document.createElement('input');
fileInput.setAttribute('type', 'file');

fileInput.onchange = function() {
  var file = fileInput.files[0];
  var reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = function () {
    // strip beginning from string
    var encodedData = reader.result.replace(/data:image\/jpeg;base64,/, '');
  };
};

fileInput.click();
```

In order to use this code in production I wrote an AngularJS service which first
checks whether I'm in the browser or on the actual device. Depending on the
environment it either runs the code from above or starts the Cordova camera plugin.

```js
angular.module('app.services')
.factory('camera', ['$rootScope', '$q', 'env', function($rootScope, $q, env) {

  return {
    getPicture: function(options) {

      // init $q
      var deferred = $q.defer();

      if (env.browser) {

        // create file input without appending to DOM
        var fileInput = document.createElement('input');
        fileInput.setAttribute('type', 'file');

        fileInput.onchange = function() {
          var file = fileInput.files[0];
          var reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = function () {
            $rootScope.$apply(function() {
              // strip beginning from string
              var encodedData = reader.result.replace(/data:image\/jpeg;base64,/, '');
              deferred.resolve(encodedData);
            });
          };
        };

        fileInput.click();

      } else {

        // set some default options
        var defaultOptions = {
          quality: 75,
          destinationType: Camera.DestinationType.DATA_URL,
          allowEdit: true,
          targetWidth: 75,
          targetHeight: 75
        };

        // allow overriding the default options
        options = angular.extend(defaultOptions, options);

        // success callback
        var success = function(imageData) {
          $rootScope.$apply(function() {
            deferred.resolve(imageData);
          });
        };

        // fail callback
        var fail = function(message) {
          $rootScope.$apply(function() {
            deferred.reject(message);
          });
        };

        // open camera via cordova
        navigator.camera.getPicture(success, fail, options);

      }

      // return a promise
      return deferred.promise;

    }
  };

}]);
```

Inject this service into your controller and call it.

```js
angular.module('app.controllers').controller('PhotoCtrl',
['$scope', 'camera', function($scope, camera) {

    // can be a button click or anything else
    $scope.takePicture = function() {
      camera.getPicture()
        .then(function(imageData) {
          // imageData is your base64-encoded image
          // update some ng-src directive
          $scope.picSrc = "data:image/jpeg;base64," + imageData;
        })
        .catch(function(err) {
          console.log(err);
        });
    };

}]);
```

You are now able to run your app in the browser on your local machine. As soon
as you call `takePicture` the normal file input dialog pops up and you can
chose an image from file. That image is converted into its base64 representation
and returned from our AngularJS service. Running this code on the device starts
the camera app as expected.

You might wonder why I removed `data:image/jpeg;base64,` within the service and
prepended it again in the controller. In a real application you'd want to save
the image somewhere, for example a database like [PouchDB](http://pouchdb.com/).
Attachments in PouchDB are stored as Blobs. Converting a base64-encoded String
into a blob won't work with `data:image/jpeg;base64,` at the beginning. You need
the raw data.

Before you ask here are two helper functions to convert Base64 to Blob and vice versa.

```js
angular.module('app.services').factory('utils',
['$rootScope', '$q', function($rootScope, $q) {

  return {
    base64ToBlob: function(data) {
      // https://github.com/daleharvey/pouchdb/blob/master/tests/test.attachments.js#L523
      var decodedData = PouchDB.utils.atob(data);
      var fixedBinary = PouchDB.utils.fixBinary(decodedData);
      var blob = PouchDB.utils.createBlob([fixedBinary], {type: 'image/jpeg'});
      return blob;
    },
    blobToBase64: function(blob) {
      var deferred = $q.defer();
      var reader = new FileReader();
      reader.readAsBinaryString(blob);
      reader.onloadend = function() {
        var res = this.result;
        $rootScope.$apply(function() {
          deferred.resolve(PouchDB.utils.btoa(res));
        });
      };
      return deferred.promise;
    }
  };
}]);
```

Now have fun with the camera plugin.
