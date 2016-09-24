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
var _ = require('lodash');
var Promise = require('bluebird');

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
  newglobal = Object.assign(newglobal, bindings || {});
  vm.runInNewContext(src, newglobal);
  module.exports.plugins.push(filename);
}

var message = {
    fr: {
        notwithinit: "Ne doit être utilisé que dans it()",
        notwithindescribe: "Ne doit être utilisé que dans describe()"
    },
    en: {
        notwithinit: "Not within it()",
        notwithindescribe: "Not within describe()"
    }
};

function run_hook (o, name) {
    var method = o[name + 'Hook'];
    if ( method ) {
        try {
            method.call(o);
        } catch (exc) {
            o[name + 'HookException'] = exc;
        }
    }
}

// *********** Description *************

function Description (msg, f, options) {
  // Static fields:
  this.message = msg;
  this.behavior = f;
  this.verbose = false;
  this.specificationIntended = undefined;
  Object.assign(this, options || {});
  // Internal (dynamic) fields:
  this.specifications = [];
  this.result = undefined;
  this.raisedException = false;
  this.exception = null;
  this.specificationAttempted = 0;
  this.specificationSuccessful = 0;
  this.expectationAttempted = 0;
  this.expectationSuccessful = 0;
  this.pass = false;
  this.log = [];
}
Description.prototype.run = function () {
    var description = this;
    description.log_("Description run");
    var promise = new Promise(function (resolve, reject) {
        try {
            description.log_("Description run Promise");
            description.result = description.behavior.call(description);
        } catch (exc) {
            description.log_("Description run Promise catch " + exc);
            description.raisedException = true;
            description.exception = exc;
            description.result = undefined;
        }
        description.update_();
        resolve(description);
    }).finally(function () {
        description.log_("Description run Promise finally");
        return description.run_specifications();
    });
    return promise;
};
Description.prototype.log_ = function (msg) {
    this.log.push([ process.uptime(), msg]);
}
Description.prototype.run_specifications = function () {
    var description = this;
    description.log_("Description run_specifications");
    function run_specification (i) {
        if ( i < description.specifications.length ) {
            description.log_("Description run_specification " + i);
            var spec = description.specifications[i];
            return spec.run()
                .finally(function () {
                    description.log_("Description run_specification finally");
                    if ( !spec.pass && spec.stopOnFailure ) {
                        return Promise.reject(false);
                    } else {
                        return run_specification(i+1);
                    }
                });
        } else {
            return Promise.resolve(true);
        }
    }
    return run_specification(0);
};
// A description behaves similarly to a Promise except that then is
// renamed hence.
Description.prototype.hence = function () {
    return this.promise.then.apply(this.promise, arguments);
};
Description.prototype.beginHook = function () {
  return this;
};
Description.prototype.endHook = function () {
  return this;
};
Description.prototype.update_ = function () {
    var description = this;
    description.log_("Description update_");
    description.pass = true;
    // Recompute specificationSuccessful:
    description.expectationAttempted = 0;
    description.expectationSuccessful = 0;
    description.specificationSuccessful = 0;
    function isPassed (spec) {
        // One failed specification fails the entire description
        if ( spec.pass ) {
            description.specificationSuccessful++;
        } else {
            description.pass = false;
        }
        description.expectationAttempted += spec.expectationAttempted;
        description.expectationSuccessful += spec.expectationSuccessful;
    }
    description.specifications.forEach(isPassed);
    // check intended versus attempted:
    if ( description.specificationIntended &&
         description.specificationAttempted !=
         description.specificationIntended ) {
        description.pass = false;
    }
    return description;
};

function describe (msg, f, options) {
    var description = new Description(msg, f, options);
    description.log_("describe " + msg);
    run_hook(description, 'begin');
    inner_it = mk_it(description);
    description.promise = description.run()
        .catch(function (exc) {
            description.log_("describe catch " + exc);
            description.exception = exc;
            description.raisedException = true;
        })
        .finally(function () {
            description.log_("describe finally");
            inner_it = wrong_it;
            description.update_();
            run_hook(description, 'end');
            return description;
        });
    return description;
}

// *********** Specification *************

function Specification (description, msg, f, options) {
  // Static fields:
  this.description = description;
  description.log_("Specification: " + msg);
  description.specifications.push(this);
  this.message = msg;
  this.behavior = f;
  this.stopOnFailure = false;
  this.expectationIntended = undefined;
  this.verbose = description.verbose;
  Object.assign(this, options || {});
  // Internal (dynamic) fields:
  this.expectations = [];
  this.result = undefined;
  this.raisedException = false;
  this.exception = null;
  this.expectationAttempted = 0;
  this.expectationSuccessful = 0;
  this.pass = false;
}
Specification.prototype.run = function () {
    var spec = this;
    run_hook(spec, 'begin');
    var description = spec.description;
    description.log_("Specification run");
    description.specificationAttempted++;
    description.log_("Specification run start");
    var donePromise = new Promise(function (resolve, reject) {
        inner_expect = mk_expect(spec);
        inner_fail = mk_fail(spec);
        // spec.done true means that the promise is fullfilled!
        spec.done = false;
        spec.result = undefined;
        try {
            if ( spec.behavior.length === 0 ) {
                description.log_("Specification run start try0");
                spec.result = spec.behavior.call(spec);
                description.log_("Specification run start try0 end");
                spec.done = true;
                resolve(spec.result);
            } else {
                function done () {
                    description.log_("Specification run start done");
                    spec.done = true;
                    resolve(spec.result);
                }
                description.log_("Specification run start try>0");
                spec.result = spec.behavior.call(spec, done);
                description.log_("Specification run start try>0 end");
            }
        } catch (exc) {
            description.log_("Specification run start catch " + exc);
            spec.exception = exc;
            spec.raisedException = true;
            spec.done = true;
            reject(exc);
        }
    });
    var delayedPromise = new Promise(function (resolve, reject) {
        setTimeout(function () {
            description.log_("Specification run start delayedPromise");
            if ( ! spec.done ) {
                reject(new Error("Timeout exhausted"));
            }
        }, spec.timeout);
    });
    spec.promise = Promise.race([donePromise, delayedPromise])
      .catch(function (exc) {
          description.log_("Specification run catch");
          spec.exception = exc;
          spec.raisedException = true;
          if ( spec.stopOnFailure ) {
              spec.pass = false;
          }
      })
      .finally(function (result) {
          description.log_("Specification run finally");
          inner_expect = wrong_expect;
          inner_fail = wrong_fail;
          spec.expectations.forEach(function (expectation) {
              run_hook(expectation, 'end');
          });
          spec.update_();
          run_hook(spec, 'end');
          if ( spec.stopOnFailure && ! spec.pass ) {
              throw spec.raisedException;
          }
          return Promise.resolve(spec.result);
      });
    return spec.promise;
};
Specification.prototype.beginHook = function () {
  return this;
};
Specification.prototype.endHook = function () {
  return this;
};
Specification.prototype.update_ = function () {
  var spec = this;
  spec.description.log_("Specification update_");
  spec.pass = true;
  // recompute expectationSuccessful:
  spec.expectationSuccessful = 0;
  spec.expectations.forEach(function (expectation) {
    if ( expectation.pass ) {
      spec.expectationSuccessful++;
    } else {
      // One failed expectation fails the entire specification!
      spec.pass = false;
    }
  }, spec);
  // Check intended versus attempted:
  if ( spec.expectationIntended &&
    spec.expectationIntended != spec.expectationAttempted ) {
      spec.pass = false;
    }
    // propagate to description:
    spec.description.update_();
    return spec;
  };

function mk_it (description) {
    var newit = function (msg, f, options) {
        if ( options && _.isNumber(options) ) {
            options = {timeout: options};
        } else if ( options && _.isObject(options) ) {
            options = Object.assign({timeout: (4.75*1000)}, options);
        } else {
            options = {timeout: 4.75*1000};
        }
        var spec = new Specification(description, msg, f, options);
        return spec;
    };
    return newit;
}

// *********** Expectation *************

function Expectation (spec, options) {
  // Static fields:
  this.specification = spec;
  spec.expectations.push(this);
  this.stopOnFailure = spec.stopOnFailure;
  this.verbose = spec.verbose;
  // Optional fields:
  this.thunk = undefined;
  this.code = undefined;
  Object.assign(this, options || {});
  spec.description.log_("Expectation: " + this.actual);
  // Internal (dynamic) fields:
  this.raisedException = false;
  this.exception = null;
  this.pass = false;
  this.index = ++this.specification.expectationAttempted;
  this.runEndHook = false;
}
Expectation.prototype.run = function () {
  run_hook(this, 'begin');
  // this.endHook() will be run just before Specification.endHook() or
  // just before the beginHook() of the next Specification.
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
    Object.assign(expectation, options || {});
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
    Expectation.prototype[name] =
        function () {
            var expectation = this;
            expectation.specification.description.log_(name);
            return fn.apply(expectation, arguments);
        };
    fn.toString = function () {
        return name;
    };
}

// not
defineMatcher('not', function (options) {
    throw new Failure(this, "not yet implemented");
});

defineMatcher('toBe', function (expected, options) {
  try {
    Object.assign(this, options || {});
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
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toEqual', function (expected, options) {
    try {
        Object.assign(this, options || {});
        this.pass = true;
        if ( ! _.isEqual(this.actual, expected) ) {
            this.pass = false;
            if ( this.stopOnFailure ) {
                var exc = this.raisedException ?
                    this.exception : new Failure(this, arguments);
                throw exc;
            }
        }
    } finally {
        run_hook(this, 'match');
    }
    return this;
});

defineMatcher('toBeDefined', function (options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || typeof this.actual === 'undefined' ) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        var exc = new Failure(this, arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeUndefined', function (options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || typeof this.actual !== 'undefined' ) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        var exc = new Failure(this, arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeNull', function (options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || this.actual !== null ) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        var exc = new Failure(this, arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeNaN', function (options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || this.actual === this.actual ) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        var exc = new Failure(this, arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeTruthy', function (options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || !this.actual) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        var exc = new Failure(this, arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeFalsy', function (options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || !!this.actual) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        var exc = new Failure(this, arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toContain', function (expected, options) {
    throw new Failure(this, "not yet implemented");
});

defineMatcher('toBeLessThan', function (expected, options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || this.actual >= expected) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        var exc = new Failure(this, arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeGreaterThan', function (expected, options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || this.actual <= expected) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        var exc = new Failure(this, arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeCloseTo', function (expected, precision, options) {
  try {
    if (precision !== 0) {
      precision = precision || 2;
    }
    var delta = (Math.pow(10, -precision) / 2);
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || Math.abs(this.actual -expected) > delta) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        var exc = new Failure(this, arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toMatch', function (regexp, options) {
  try {
    Object.assign(this, options || {});
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
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeFunction', function (options) {
  try {
    Object.assign(this, options || {});
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
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeA', function (className, options) {
  try {
    Object.assign(this, options || {});
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
    run_hook(this, 'match');
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
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toThrow', function () {
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
    run_hook(this, 'match');
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
      run_hook(this, 'match');
  }
  return this;
});

// Specific matcher telling that no more matchers will be applied on
// the current expectation. This triggers the expectation endHook sooner.
Expectation.prototype.done = function () {
  run_hook(this, 'end');
};

// NOTA provide immutable front_* function to be a relay to a mutable one:
function wrong_it (msg, f) {
  throw message[lang || 'en'].notwithindescribe + msg + f;
}
var inner_it = wrong_it;
function front_it () {
  return inner_it.apply(this, arguments);
}

function wrong_expect (actual) {
  throw message[lang || 'en'].notwithinit + actual;
}
var inner_expect = wrong_expect;
function front_expect () {
  return inner_expect.apply(this, arguments);
}

function wrong_fail () {
    throw message[lang || 'en'].notwithinit;
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
  message:  message,
  require:  require,
  // These classes are provided for hooks providers:
  class: {
    Description:   Description,
    Specification: Specification,
    Expectation:   Expectation,
    Failure:       Failure
  },
  // record which plugins are yasmini.loaded:
  plugins: [],
  // These modules may be useful for yasmini.load-ed files:
  imports: {
      module: module,
      path: path,
      fs:   fs,
      vm:   vm,
      util: util,
      _:    _,
      console: console
  }
};
module.exports.yasmini = module.exports;

// end of yasmini.js
