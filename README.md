# Yasmini

Yasmini is a light framework inspired by Jasmine. It was written for
CodeGradX, an infrastructure for mechanically grading programs.
Yasmini is a framework to help grading Javascript programs.

Grading programs is supported by unit testing however rather than being
strictly binary (tests pass all or fail), CodeGradX has to deliver a grade
that tries to be faithful to the amount of successful tests. In order to
avoid cheating, we also don't want to reveal the answers of the failed tests;
we also count the number of successful expectations rather than the
number of successful specifications though this number can also be taken
into account.

For this personal framework (but you are free to use it), I started using
Jasmine but I also wanted the same code to be used for my own tests and for
grading students' programs. The amount of patches was too big and probably
too dependent of the precise version of Jasmine so I decided to write my
own framework. The name Yasmini stands for a mini-Jasmine.

## Synopsis

```javascript
var yasmini = require('yasmini');
var describe = yasmini.describe,
    it       = yasmini.it,
    expect   = yasmini.expect;

var d1 = describe("some program", function () {
  var it1 = it("should run this", function () {
    var e1 = expect(2+2).toBe(4);
    var e2 = expect(e1.raisedException, {
      verbose: false
    }).toBe(false);
  }, { // options
        stopOnFailure: true
  });
  expect(it1.expectationAttempted).toBe(it1.expectationSuccessful);
}, { // options
      verbose: true
});
```

As seen in the previous example and using Jasmine words,
description, specification and expectation are objects that are
accessible and inspectable: a reflexive feature.
When built, their constructor admit an optional last parameter to set
some options.

By default, there is no verbalization of the tests.

## Description
