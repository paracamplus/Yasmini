"use strict";
/*
Copyright (C) 2015 Christian.Queinnec@CodeGradX.org

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

See git

*/

// Require some node.js modules:
var vm = require('vm');

/*
* Enrich an object with a number of sources (processed from left to right).
* Usage   target = enrich(target, source1, source2, ...);
*/
var enrich = function (target) {
  for ( var i=1 ; i<arguments.length ; i++ ) {
    var source = arguments[i];
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
};

function Description (msg, f, options) {
  this.message = msg;
  this.behavior = f;
  this.verbose = false;
  enrich(this, options || {});
  // Internal fields:
  this.specifications = [];
  this.result = undefined;
  this.raisedException = false;
  this.exception = null;
  this.specificationAttempted = 0;
  this.specificationSuccessful = 0;
}
Description.prototype.run = function () {
  this.result = this.behavior.call(this);
};
Description.prototype.beginHook = function () {
  return this;
};
Description.prototype.endHook = function () {
  return this;
};

function describe (msg, f, options) {
  var description = new Description(msg, f, options);
  var previous_it = it;
  try {
    description.beginHook();
    module.exports.it = it = mk_it(description);
    description.run();
  } catch (exc) {
    description.exception = exc;
    description.raisedException = true;
  } finally {
    module.exports.it = wrong_it;
    it = previous_it;
    description.endHook();
  }
  return description;
}

function Specification (description, msg, f, options) {
  this.description = description;
  description.specifications.push(this);
  this.message = msg;
  this.behavior = f;
  this.stopOnFailure = false;
  this.verbose = description.verbose;
  enrich(this, options || {});
  // Internal fields:
  this.expectations = [];
  this.result = undefined;
  this.raisedException = false;
  this.exception = null;
  this.expectationAttempted = 0;
  this.expectationSuccessful = 0;
}
Specification.prototype.run = function () {
  this.result = this.behavior.call(this);
};
Specification.prototype.beginHook = function () {
  return this;
};
Specification.prototype.endHook = function () {
  return this;
};

function mk_it (description) {
  var newit = function (msg, f, options) {
    var spec = new Specification(description, msg, f, options);
    var previous_expect = expect;
    try {
      spec.beginHook();
      description.specificationAttempted++;
      module.exports.expect = expect = mk_expect(spec);
      spec.run();
      description.specificationSuccessful++;
    } catch (exc) {
      spec.exception = exc;
      spec.raisedException = true;
      if ( spec.stopOnFailure ) {
        throw exc;
      }
    } finally {
      module.exports.expect = wrong_expect;
      expect = previous_expect;
      spec.expectations.forEach(function (expectation) {
        if ( expectation.pass ) {
          spec.expectationSuccessful++;
        }
        expectation.endHook();
      });
      spec.endHook();
    }
    return spec;
  };
  return newit;
}

function Expectation (spec, options) {
  this.specification = spec;
  spec.expectations.push(this);
  this.stopOnFailure = spec.stopOnFailure;
  this.verbose = spec.verbose;
  // Optional fields:
  this.thunk = undefined;
  this.code = undefined;
  enrich(this, options || {});
  // Internal fields:
  this.raisedException = false;
  this.exception = null;
  this.pass = true;
  this.index = ++this.specification.expectationAttempted;
}
Expectation.prototype.run = function () {
  this.beginHook();
  //this.endHook(); will be done before Specification.endHook()
  return this;
};
Expectation.prototype.beginHook = function () {
  return this;
};
Expectation.prototype.endHook = function () {
  return this;
};
Expectation.prototype.toBe = function (expected, options) {
  enrich(this, options || {});
  if (this.raisedException || this.actual !== expected) {
    this.pass = false;
    if ( this.stopOnFailure ) {
      var exc = new Error(this);
      throw exc;
    }
  }
  return this;
};
Expectation.prototype.try = function () {
  try {
    this.thunk = this.actual;
    this.actual = undefined;
    this.actual = this.thunk.call(this);
  } catch (exc) {
    this.raisedException = true;
    this.exception = exc;
    this.pass = false;
    if (this.stopOnFailure) {
      throw exc;
    }
  }
  return this;
};
Expectation.prototype.toThrow = function () {
  if ( ! this.thunk ) {
    // Force a try() if not yet done!
    this.try();
  }
  if (this.raisedException) {
    this.pass = true;
  } else {
    this.pass = false;
    if (this.stopOnFailure) {
      var exc = new Error(this);
      throw exc;
    }
  }
  return this;
};
Expectation.prototype.eval = function () {
  try {
    this.code = this.actual;
    this.actual = undefined;
    this.actual = vm.runInThisContext(this.code);
  } catch (exc) {
    this.raisedException = true;
    this.exception = exc;
    this.pass = false;
    if (this.stopOnFailure) {
      throw exc;
    }
  }
  return this;
};

function mk_expect (spec) {
  var new_expect = function (actual, options) {
    var expectation = new Expectation(spec, {
        actual: actual
      });
    enrich(expectation, options || {});
    expectation.run();
    return expectation;
  };
  return new_expect;
}

function wrong_it (msg, f) {
  throw "Not within describe()" + msg + f;
}
var it = wrong_it;

function wrong_expect (actual) {
  throw "Not within it()" + actual;
}
var expect = wrong_expect;

module.exports = {
  describe: describe,
  it: it,
  expect: expect,
  class: {
    Description: Description,
    Specification: Specification,
    Expectation: Expectation
  }
};

// end of yasmini.js
