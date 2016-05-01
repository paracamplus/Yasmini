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
var util = require('util');

/*
* Load utility. The utility file should be stored aside yasmini.js
* that is, in the same directory. The file is loaded in its own context
* optionally enriched by some bindings.
*/

function load (filename, bindings) {
  var f = path.join(__dirname, filename);
  var src = fs.readFileSync(f);
  var newglobal = {
    yasmini: module.exports,
    require: require,
    console: console
  };
  newglobal = enrich(newglobal, bindings || {});
  vm.runInNewContext(src, newglobal);
  module.exports.plugins.push(filename);
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
  this.expectationAttempted = 0;
  this.expectationSuccessful = 0;
  this.pass = false;
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
Description.prototype.update_ = function () {
    this.pass = true;
    // Recompute specificationSuccessful:
    this.expectationAttempted = 0;
    this.expectationSuccessful = 0;
    this.specificationSuccessful = 0;
    this.specifications.forEach(function (spec) {
        // One failed specification fails the entire description
        if ( spec.pass ) {
            this.specificationSuccessful++;
        } else {
            this.pass = false;
        }
        this.expectationAttempted += spec.expectationAttempted;
        this.expectationSuccessful += spec.expectationSuccessful;
    }, this);
    // check intended versus attempted:
    if ( this.specificationIntended &&
         this.specificationAttempted !=
           this.specificationIntended ) {
        this.pass = false;
    }
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
    description.update_();
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
  this.pass = false;
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
Specification.prototype.update_ = function () {
  this.pass = true;
  // recompute expectationSuccessful:
  this.expectationSuccessful = 0;
  this.expectations.forEach(function (expectation) {
    if ( expectation.pass ) {
      this.expectationSuccessful++;
    } else {
      // One failed expectation fails the entire specification!
      this.pass = false;
    }
  }, this);
  // Check intended versus attempted:
  if ( this.expectationIntended &&
    this.expectationIntended != this.expectationAttempted ) {
      this.pass = false;
    }
    // propagate to description:
    this.description.update_();
    return this;
  };

function mk_it (description) {
  var newit = function (msg, f, options) {
    var spec = new Specification(description, msg, f, options);
    try {
      spec.beginHook();
      description.specificationAttempted++;
      inner_expect = mk_expect(spec);
      inner_fail = mk_fail(spec);
      spec.run();
    } catch (exc) {
      spec.exception = exc;
      spec.raisedException = true;
      if ( spec.stopOnFailure ) {
        spec.pass = false;
        throw exc;
      }
    } finally {
      inner_expect = wrong_expect;
      inner_fail = wrong_fail;
      spec.expectations.forEach(function (expectation) {
          try {
              expectation.endHook();
          } catch (exc) {
              expectation.endHookException = exc;
          }
      });
      spec.update_();
      try {
          spec.endHook();
      } catch (exc) {
          spec.endHookException = exc;
      }
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
  this.pass = false;
  this.index = ++this.specification.expectationAttempted;
  this.runEndHook = false;
}
Expectation.prototype.run = function () {
  this.beginHook();
  // this.endHook() will be run just before Specification.endHook() or
  // just before the next beginHook().
  return this;
};
Expectation.prototype.beginHook = function () {
  return this;
};
Expectation.prototype.matchHook = function () {
  return this;
};
Expectation.prototype.endHook = function () {
  // endHook run only once per expectation:
  if ( ! this.runEndHook ) {
      this.runEndHook = true;
  }
  return this;
};
Expectation.prototype.update_ = function () {
  // Propagate to enclosing specification:
  this.specification.update_();
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

function mk_fail (spec) {
    var new_fail = function (msg) {
        var failure = new Failure(null, [msg]);
        throw failure;
    };
    return new_fail;
}

function Failure (expectation, args) {
    this.expectation = expectation;
    this.matcher = args.callee;
    this.args = args;
}
Object.setPrototypeOf(Failure.prototype, Error.prototype);

Failure.prototype.toString = function () {
    var it = this.expectation;
    var msg = "Failure";
    if ( it && it.actual && this.matcher ) {
        msg += " on expect(" +
            it.actual + ').' +
            this.matcher.toString() + '(...)';
    }
    if ( it.exception ) {
        if ( it.raisedException ) {
            msg += ' raised ' + it.exception;
        } else {
            msg += ' fails with ' + it.exception;
        }
    }
    return msg;
}

// Matchers
// FUTURE: should not be used after endHook()

function defineMatcher(name, fn) {
    Expectation.prototype[name] = fn;
    fn.toString = function () {
        return name;
    };
}

defineMatcher('toBe', function (expected, options) {
  try {
    enrich(this, options || {});
    this.pass = true;
    if (this.raisedException || this.actual !== expected) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        var exc = this.raisedException ?
            this.exception : new Failure(this, arguments);
        throw exc;
      }
    }
  } finally {
    this.matchHook();
  }
  return this;
});

defineMatcher('toBeTruthy', function (options) {
  try {
    enrich(this, options || {});
    this.pass = true;
    if (this.raisedException || !this.actual) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        var exc = new Failure(this, arguments);
        throw exc;
      }
    }
  } finally {
    this.matchHook();
  }
  return this;
});

defineMatcher('toMatch', function (regexp, options) {
  try {
    enrich(this, options || {});
    this.pass = true;
    regexp = new RegExp(regexp); // Check regexp
    if (this.raisedException || ! regexp.test(this.actual.toString())) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        var exc = new Failure(this, arguments);
        throw exc;
      }
    }
  } finally {
    this.matchHook();
  }
  return this;
});

defineMatcher('toBeFunction', function (options) {
  try {
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
  } finally {
    this.matchHook();
  }
  return this;
});

defineMatcher('toBeA', function (className, options) {
  try {
    enrich(this, options || {});
      this.pass = false;
    if ( typeof(this.actual) === 'object' ) {
        if ( this.actual.constructor === className ) {
            this.pass = true;
        }
    }
    if (! this.pass && this.stopOnFailure) {
        throw "Not an instance of " + className;
    }
  } finally {
    this.matchHook();
  }
  return this;
});

defineMatcher('invoke', function () {
  try {
    this.thunk = this.actual;
    this.actual = undefined;
    this.actual = this.thunk.apply(this, arguments);
  } catch (exc) {
    this.exception = exc;
    this.raisedException = true;
  } finally {
    this.matchHook();
  }
  return this;
});

defineMatcher('toThrow', function () {
  if ( ! this.thunk ) {
    // Force invoke() if not yet done!
    this.invoke.apply(this, arguments);
  }
  try {
    if (this.raisedException) {
      this.pass = true;
    } else {
      this.pass = false;
      if (this.stopOnFailure) {
        var exc = new Failure(this, arguments);
        throw exc;
      }
    }
  } finally {
    this.matchHook();
  }
  return this;
});

defineMatcher('eval', function () {
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
  } finally {
      this.matchHook();
  }
  return this;
});

// Specific matcher telling that no more matchers will be applied on
// the current expectation. This triggers the expectation endHook sooner.
Expectation.prototype.done = function () {
  this.endHook();
};

// NOTA provide immutable front_* function to be a relay to a mutable one:
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

function wrong_fail () {
    throw "Not within it()";
}
var inner_fail = wrong_fail;
function front_fail () {
    return inner_fail.apply(this, arguments);
}

module.exports = {
  describe: describe,
  it:       front_it,
  expect:   front_expect,
  fail:     front_fail,
  load:     load,
  require:  require,
  // These classes are provided for hooks providers:
  class: {
    Description:   Description,
    Specification: Specification,
    Expectation:   Expectation,
    Failure:       Failure
  },
  // record 
  plugins: [],
  // These modules may be useful for yasmini-load-ed files:
  imports: {
      module: module,
      path: path,
      fs:   fs,
      vm:   vm,
      util: util,
      console: console
  }
};
module.exports.yasmini = module.exports;

// end of yasmini.js
