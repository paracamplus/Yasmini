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
grading students' programs. To achieve this, the amount of patches was too
big and probably too dependent of the precise version of Jasmine so I decided
to write my own framework. The name Yasmini stands for a mini-Jasmine.

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

## Usage

Yasmini is directly inspired by Jasmine however Yasmini is far from
implementing all of Jasmine: Yasmini lacks a number of Matchers and does
not (yet) support tests of callbacks. Yasmini is much simpler and
offers other features that I found useful. So first, if you want to use
Yasmini, look at Jasmine documentation on http://jasmine.github.io/

One very important feature of Yasmini is that whenever an expectation is
begun, checked, finished or a specification or a description the counters
in these various instances are kept up to date. For instance the
verbalizer of CodeGradX records the state of the descriptions in a file so,
if the javascript process is killed from the outside (perhaps because it
takes too much time), the final state of the tests can be known. Why killing
from the outside ? Because programmers' code sometimes loops infinitely or
waits indefinitely!

### Installation

```sh
npm install -g yasmini
```

### Introduction

This is a common way to require Yasmini, make the three fundamental
functions (`describe`, `it` and `expect`) available and enrich Yasmini with
a verbalizer (you are free to code yours).

```javascript
var yasmini = require('yasmini');
var describe = yasmini.describe,
    it       = yasmini.it,
    expect   = yasmini.expect;
yasmini.load('yasmini-verbalize.js', {myfunction: myfunction});
```

Yasmini also exports some classes so you may write your own hooks.

### Description

Tests are written within a Description. The first two arguments (the
message and the behavior) are mandatory. The optional third argument sets
some options on the Description objects.
All options are optional, their default value is shown below:

```javascript
var d = describe("message", function () {
  // write Specifications here...
}, {
  verbose: false,
  specificationIntended: undefined
});
// do something with d.someField
```

The `verbose` option specifies verbosity. Its only purpose is to be inherited
by default, by specifications.

The `specificationIntended` if set, specifies how many specifications should
be run within the description.

The `describe` function creates a `Description` instance,
runs the `beginHook` method then runs the function
given as second argument. After running that function, the `endHook`
is run and the description will hold the following fields:

* `specifications` the array of inner Specifications
* `raisedException` a boolean telling if the behavior was exited
  with an exception
* `exception` the exception if raisedException is true
* `specificationAttempted` the number of attempted specifications
* `specificationSuccessful` the number of successful specifications
* `pass` a boolean that is true iff all specifications are passed successfully,
  if `specificationIntended` is specified then it should be equal to
   `specificationAttempted` and to `specificationSuccessful`.

### Specification

Within a description are written specifications created by the `it` function.
The first two arguments (message and behavior) are mandatory. The last one
sets options with default shown below:

```javascript
var s = it("message", function () {
  // write expectations here ...
}, {
  verbose: d.verbose, // inherited
  stopOnFailure: false,
  expectationIntended: 6
});
// do something with s.someField
```

The `verbose` option specifies verbosity. By default, it is inherited
from the enclosing description. Its only purpose is to be inherited
by default, by inner expectations.

The `expectationIntended` if set, specifies how many expectations should
be run within the specification.

The `stopOnFailure` if true requires `it` to exit as soon as an expectation
is not met.

The `it` function creates an `Specification` instance and runs immediately
the `beginHook` method and its behavior. When the behavior terminates,
the `endHook` method of all inner expectations are run then, the
`endHook` method of the specification instance is run and eventually
holds a number of fields:

* `expectations` an array of expectations
* `description` is the enclosing `Description` instance
* `raisedException` a boolean telling if the behavior was exited
  with an exception
* `exception` the exception if raisedException is true
* `expectationAttempted` the number of attempted expectations
* `expectationSuccessful` the number of successful expectations
* `pass` a boolean that is true iff all expectations are passed successfully,
  if `expectationIntended` is specified then it should be equal to
   `expectationAttempted` and to `expectationSuccessful`.
* `endHookException` if the endHook raises an exception. This is useful for
  hooks providers.

### Expectation

Expectations are created with the `expect` function which takes one mandatory
argument and optionally some options.

```javascript
expect(actual).toBe(expected)
expect(actual).toBeTruthy()
expect(actual).toBeA(Class)
expect(actual).toMatch(regexp)
expect(string).eval()...
expect(function).toThrow()
expect(function).invoke(values...)...
expect(actual).done();

// More complex example:
expect(something, {
  stopOnFailure: s.stopOnFailure,
  verbose: s.verbose,
  code: "string"
}).eval().invoke(1, 2, 3).toBeTruthy().toBe(something).done();
```

First the arguments are computed and given to the `expect` function. An
`Expectation` instance is created and the `beginHook` method is run.
Every matcher invocation invokes the `matchHook` hook.
Note that the `endHook` is run by the enclosing specification. Among
the possible options are the usual ones `verbose` and `stopOnFailure`.

The `code` option may be set to tailor some verbalization message. If the
`eval` matcher is used, then `code` will be set with the string.

When the `endHook` method is run, the Expectation instance holds a number
of fields:

* `specification` is the enclosing `Specification` instance
* `index` is the rank (1-based) of the expectation within the specification
* `actual` is the value of the first parameter (this value may be altered
  by some matchers)
* `raisedException` a boolean telling if the behavior was exited
  with an exception
* `exception` the exception if raisedException is true
* `pass` a boolean that is true iff the expectation was successful.
* `endHookException` if the endHook raises an exception. This is useful for
  hooks providers.

The expectation per se does not check anything, its methods (called Matchers
in Jasmine parlance) will do the work. Depending on the matcher, the
first argument (say the `actual`) may be a string, a function or anything.

When the `matchHook` method is run, the Expectation instance holds a
number of fields as listed above though some further matchers may
alter the content of these fields.

### Matchers

The simplest matcher is `toBeTruthy` which checks that `actual` is true
according to Javascript.

Then comes `toBe(expected)` which checks that `actual` is identical to
`expected`.

The `toBeA(classname)` checks whether `actual` is an instance of `classname`.

The `toMatch(regexp)` matcher converts `actual` to a string and checks
whether the regexp acccepts it.

The `toThrow` matcher considers `actual` to be a thunk (a function without
argument) to invoke; it then checks that the function throws something.
This matcher invokes the `invoke` matcher if not yet done.

The `invoke` matcher considers `actual` to be a function to invoke
(possibly with some arguments); `actual` is reset to the obtained
value.

The `eval` matcher considers `actual` to be a string which must be `eval`-ed.
The resulting value will replace `actual` so you may chain this matcher
with other matchers.

All matchers run the `matchHook` hook and return the input
`Expectation` so they may be chained. Note however that expectations
are counted but not matchers so `expect(...).toBe(true).toBeTruthy()`
only counts for one expectation.

If an expectation fails and `stopOnFailure` is true then a `Failure`
(a kind of `Error`) is thrown with an `expectation` property set with
the failed expectation, a `matcher` property with the failed matcher and
an `args` property with the arguments of the failed matcher.

# Adjunctions

The file `yasmini-verbalize.js` is an example of an adjunction to Yasmini.
It verbalizes in French the results of the tests. Defining `beginHook` and
`endHook` on `Description`, `Specification` and `Expectation` does the trick.

Adjunctions files must be stored aside the `yasmini.js` file that is,
in the same directory, and are loaded with the `yasmini.load` function
(which provides the `yasmini` global variable). It is possible to
provide a second argument defining bindings for the adjoined file.

Feel free to write your own adjunctions and share them!

# Examples

The `spec/ytests.js` is a test file written for Yasmini. It cannot
be processed by Jasmine.

The `yasmini-verbose-verbalize.js` file is a simple verbalizer that
displays description messages, specification messages followed by
dots for successful expectations. Something like:

```
[description
 (it .....)
 (another it ...!Failure!
 ```

The `yasmini-verbalize.js` file traces every description, specification
and expectation and accumulates these traces in the `verbalization` property
of Description instances. It is up to you to display them.

The `yasmini-codegradx-verbalize` is a more elaborate verbalizer to
be used with the CodeGradX infrastructure.
