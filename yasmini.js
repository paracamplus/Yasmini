"use strict";
// jshint module: true
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

See https://github.com/paracamplus/Yasmini.git

*/

// Require some node.js modules:
var vm = require('vm');
var path = require('path');
var fs = require('fs');

/*
* Load utility. The utility file should be stored aside yasmini.js
* It will be loaded in the very environment of Yasmini.
*/

function load (filename) {
  var f = path.join(__dirname, filename);
  var src = fs.readFileSync(f);
  vm.runInNewContext(src, {
    yasmini: module.exports
  });
}

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
  this.specificationIntended = undefined;
  enrich(this, options || {});
  // Internal fields:
  this.specifications = [];
  this.result = undefined;
  this.raisedException = false;
  this.exception = null;
  this.specificationAttempted = 0;
  this.specificationSuccessful = 0;
  this.pass = true;
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
  try {
    description.beginHook();
    inner_it = mk_it(description);
    description.run();
  } catch (exc) {
    description.exception = exc;
    description.raisedException = true;
  } finally {
    inner_it = wrong_it;
    if ( description.specificationIntended &&
         description.specificationAttempted != 
           description.specificationIntended ) {
       description.pass = false;
   }
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
  this.expectationIntended = undefined;
  this.verbose = description.verbose;
  enrich(this, options || {});
  // Internal fields:
  this.expectations = [];
  this.result = undefined;
  this.raisedException = false;
  this.exception = null;
  this.expectationAttempted = 0;
  this.expectationSuccessful = 0;
  this.pass = true;
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
    try {
      spec.beginHook();
      description.specificationAttempted++;
      inner_expect = mk_expect(spec);
      spec.run();
      description.specificationSuccessful++;
    } catch (exc) {
      spec.exception = exc;
      spec.raisedException = true;
      if ( spec.stopOnFailure ) {
        spec.pass = false;
        throw exc;
      }
    } finally {
      inner_expect = wrong_expect;
      spec.expectations.forEach(function (expectation) {
        if ( expectation.pass ) {
          spec.expectationSuccessful++;
        } else {
          // One failed expectation fails the entire specification!
          spec.pass = false;
        }
        expectation.endHook();
      });
      if ( spec.expectationIntended &&
           spec.expectationIntended != spec.expectationAttempted ) {
         spec.pass = false;
      }
      // One failed specification fails the entire description
      if ( ! spec.pass ) {
        description.pass = false;
      }
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
  // this.endHook() will be run just before Specification.endHook()
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
Expectation.prototype.toBeTruthy = function (options) {
  enrich(this, options || {});
  if (this.raisedException || !this.actual) {
    this.pass = false;
    if ( this.stopOnFailure ) {
      var exc = new Error(this);
      throw exc;
    }
  }
  return this;
};
Expectation.prototype.toMatch = function (regexp, options) {
  enrich(this, options || {});
  regexp = new RegExp(regexp); // Check regexp
  if (this.raisedException || ! regexp.test(this.actual.toString())) {
    this.pass = false;
    if ( this.stopOnFailure ) {
      var exc = new Error(this);
      throw exc;
    }
  }
  return this;
};
Expectation.prototype.toMatch = function (regexp, options) {
  enrich(this, options || {});
  regexp = new RegExp(regexp); // Check regexp
  if (this.raisedException || ! regexp.test(this.actual.toString())) {
    this.pass = false;
    if ( this.stopOnFailure ) {
      var exc = new Error(this);
      throw exc;
    }
  }
  return this;
};
Expectation.prototype.toBeFunction = function (options) {
  enrich(this, options || {});
    if ( typeof(this.actual) === 'function' ||
         this.actual instanceof Function ) {
        this.pass = true;
    } else {
        this.pass = false;
    }
    if (this.stopOnFailure) {
        throw "Not a function " + this.actual;
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
var inner_it = wrong_it;
function front_it () {
  return inner_it.apply(this, arguments);
}

function wrong_expect (actual) {
  throw "Not within it()" + actual;
}
var inner_expect = wrong_expect;
function front_expect () {
  return inner_expect.apply(this, arguments);
}

module.exports = {
  describe: describe,
  it:       front_it,
  expect:   front_expect,
  class: {
    Description: Description,
    Specification: Specification,
    Expectation: Expectation
  },
  load: load,
  imports: {
      path: path,
      fs:   fs,
      vm:   vm
  }
};
module.exports.yasmini = module.exports;

// end of yasmini.js
