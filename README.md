# yasmini

Yasmini is a light framework inspired by Jasmine. It was written for
CodeGradX, an infrastructure for grading programs. Yasmini is a
framework to help grading Javascript programs.

Grading programs is done with unit tests however rather than being
strictly binary: tests pass all or fail, we have to deliver a grade
trying to be faithful to the amount of successful tests. In order
to avoid cheating, we also don't want to reveal answers to failed tests;
we also count the number of successful expectations rather than the
number of successful specifications though this number can also be taken
into account.

## Synopsis

```javascript
var yasmini = require('yasmini');
var describe = yasmini.describe,
    it       = yasmini.it,
    expect   = yasmini.expect;

var d1 = describe("some program", function () {
  var it1 = it("should run this", function () {
    var e1 = expect(2+2).toBe(4);
    var e2 = expect(e1.raisedException, { ...options... }).toBe(false);
  }, { ... options... });
  expect(it1.expectationAttempted).toBe(it1.expectationSuccessful);
}, { ...options... });
```

As seen in the previous example, description, specification and expectation
are objects that are accessible and inspectable: a reflexive feature.
When built, their constructor admit an optional last parameter to set
some options.

## Description
