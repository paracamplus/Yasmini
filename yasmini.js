// Yasmini: A reflexive test framework
// Time-stamp: "2019-01-11 14:50:54 queinnec" 

/*
Copyright (C) 2016-2017 Christian.Queinnec@CodeGradX.org

@module yasmini
@author Christian Queinnec <Christian.Queinnec@codegradx.org>
@license ISC
@see {@link https://github.com/paracamplus/Yasmini.git|Yasmini} site.



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

*/

// Requirements
// Yasmini may run in a browser, this 'vm' module emulates the Node.js version:
var vm;
(function () {
    function evalfn (code) {
        code = `${code};`;
        return eval(code);
    }
    let shimvm = {
        runInContext: evalfn,
        runInThisContext: evalfn
    };
    try {
        vm = require('vm');
        if ( Object.keys(vm).length === 0 ) {
            vm = shimvm;
        }
    } catch (e) {
        vm = shimvm;
    }
})();
//const _ = require('lodash');
const _ = (function () {
    const isNumber = require('lodash/isNumber');
    const isObject = require('lodash/isObject');
    const isEqual  = require('lodash/isEqual');
    return { isNumber, isObject, isEqual };
})();
const Promise = require('bluebird');
let yasmini; // to be defined below

let message = {
    fr: {
        notwithinit: "expect() ne doit être utilisé que dans it() ",
        notwithindescribe: "it() ne doit être utilisé que dans describe() "
    },
    en: {
        notwithinit: "expect() not within it() ",
        notwithindescribe: "it() not within describe() "
    }
};

// NOTA provide immutable front_* function to be a relay to a mutable one:
function wrong_it (msg, f) {
  throw message[yasmini.lang || 'en'].notwithindescribe + msg + f;
}
var inner_it = wrong_it;
function front_it () {
  return inner_it.apply(this, arguments);
}

function wrong_expect (actual) {
  throw message[yasmini.lang || 'en'].notwithinit + actual;
}
var inner_expect = wrong_expect;
function front_expect () {
  return inner_expect.apply(this, arguments);
}

function wrong_fail () {
    throw message[yasmini.lang || 'en'].notwithinit;
}
var inner_fail = wrong_fail;
function front_fail () {
    return inner_fail.apply(this, arguments);
}

function run_hook (o, name) {
    let method = o[name + 'Hook'];
    if ( method ) {
        try {
            method.call(o);
        } catch (exc) {
            o[name + 'HookException'] = exc;
        }
    }
}

// All objects are identified with a number:
let id = 100*1000;

// *********** Description *************

function Description (msg, f, options) {
  this.id = ++id;
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
Description.prototype.run = function descriptionRun () {
    let description = this;
    description.log_("Description run");
    let promise = new Promise(function (resolve /*, reject */) {
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
    if ( process && process.uptime && typeof process.uptime === 'function' ) {
        this.log.push([ process.uptime(), msg]);
    } else {
        this.log.push(msg);
    }
};
Description.prototype.run_specifications =
  function descriptionRunSpecifications () {
    let description = this;
    description.log_("Description run_specifications");
    function run_specification (i) {
        if ( i < description.specifications.length ) {
            description.log_("Description run_specification " + i);
            let spec = description.specifications[i];
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
// A Description behaves similarly to a Promise except that then() is
// renamed hence(). This ensures that the hence() function will receive
// the Description as first argument:
Description.prototype.hence = function (f) {
    let description = this;
    return this.promise.then.call(this.promise, function () {
        return f(description);
    });
};
Description.prototype.beginHook = function descriptionBeginHook () {
  return this;
};
Description.prototype.endHook = function descriptionEndHook () {
  return this;
};
Description.prototype.update_ = function descriptionUpdate_ () {
    let description = this;
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
         description.specificationAttempted !==
         description.specificationIntended ) {
        description.pass = false;
    }
    return description;
};

function describe (msg, f, options) {
    let description = new Description(msg, f, options);
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
  this.id = ++id;
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
  this.index = 0;
  this.expectationAttempted = 0;
  this.expectationSuccessful = 0;
  this.pass = false;
}
Specification.prototype.run = function specificationRun () {
    let spec = this;
    run_hook(spec, 'begin');
    let description = spec.description;
    description.log_("Specification run");
    description.specificationAttempted++;
    description.log_("Specification run start");
    let donePromise = new Promise(function (resolve, reject) {
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
                let done = function done () {
                    description.log_("Specification run start done");
                    spec.done = true;
                    resolve(spec.result);
                };
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
    let delayedPromise = new Promise(function (resolve, reject) {
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
      .finally(function () {
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
Specification.prototype.beginHook = function specificationBeginHook () {
  return this;
};
Specification.prototype.endHook = function specificationEndHook () {
  return this;
};
Specification.prototype.update_ = function specificationUpdate_ () {
  let spec = this;
  spec.description.log_("Specification update_");
  spec.pass = true;
  // recompute expectationSuccessful:
  spec.expectationSuccessful = 0;
  spec.expectations.forEach(function (expectation) {
    if ( expectation.pass ) {
      spec.expectationSuccessful += expectation.weight;
    } else {
      // One failed expectation fails the entire specification!
      spec.pass = false;
    }
  }, spec);
  // Check intended versus attempted:
  if ( spec.expectationIntended &&
    spec.expectationIntended !== spec.expectationAttempted ) {
      spec.pass = false;
    }
    // propagate to description:
    spec.description.update_();
    return spec;
};

function mk_it (description) {
    let newit = function (msg, f, options) {
        if ( options && _.isNumber(options) ) {
            options = {timeout: options};
        } else if ( options && _.isObject(options) ) {
            options = Object.assign({timeout: 4.75*1000}, options);
        } else {
            options = {timeout: 4.75*1000};
        }
        let spec = new Specification(description, msg, f, options);
        return spec;
    };
    return newit;
}

// *********** Expectation *************

function Expectation (spec, options) {
  this.id = ++id;
  // Static fields:
  this.specification = spec;
  spec.expectations.push(this);
  this.stopOnFailure = spec.stopOnFailure;
  this.verbose = spec.verbose;
  // Optional fields:
  this.thunk = undefined;
  this.code = undefined;
  this.weight = 1;
  Object.assign(this, options || {});
  spec.description.log_("Expectation: " + this.actual);
  this.index = ++this.specification.index;
  this.specification.expectationAttempted += this.weight;
  // Internal (dynamic) fields:
  this.raisedException = false;
  this.exception = null;
  this.pass = false;
  this.runEndHook = false;
}
Expectation.prototype.run = function expectationRun () {
    // run the endHook of the previous expectation if any:
    let n = this.specification.expectations.length;
    if ( n > 1 ) {
        let previousExpectation = this.specification.expectations[n-2];
        run_hook(previousExpectation, 'end');
    }
    run_hook(this, 'begin');
    // this.endHook() will be run just before Specification.endHook() or
    // just before the beginHook() of the next Specification.
    return this;
};
Expectation.prototype.beginHook = function expectationBeginHook () {
  return this;
};
Expectation.prototype.matchHook = function expectationMatchHook () {
  return this;
};
Expectation.prototype.endHook = function expectationEndHook () {
  // endHook should run only once per expectation:
  if ( ! this.runEndHook ) {
      this.runEndHook = true;
  }
  return this;
};
Expectation.prototype.update_ = function expectationUpdate_ () {
  // Propagate to enclosing specification:
  this.specification.update_();
  return this;
};

function mk_expect (spec) {
  let new_expect = function (actual, options) {
    let newoptions = {actual};
    Object.assign(newoptions, options || {});  
    let expectation = new Expectation(spec, newoptions);
    expectation.run();
    return expectation;
  };
  return new_expect;
}

function mk_fail (spec) {
    let new_fail = function (msg) {
        let failure = new Failure(spec, null, null, [msg]);
        throw failure;
    };
    return new_fail;
}

function Failure (specification, expectation, matcherName, args) {
    this.specification = specification;
    this.expectation = expectation;
    this.matcherName = matcherName;
    this.args = args;
}
Object.setPrototypeOf(Failure.prototype, Error.prototype);

Failure.prototype.toString = function toString () {
    let msg = "Failure";
    let it = this.expectation;
    if ( it && it.actual && this.matcherName ) {
        msg += " on expect(" +
            it.actual + ').' +
            this.matcherName + '(...)';
    } else if ( this.matcherName ) {
        msg += " on ." +
            this.matcherName + '(...)';
    }
    if ( it && it.exception ) {
        if ( it.raisedException ) {
            msg += ' raised ' + it.exception;
        } else {
            msg += ' fails with ' + it.exception;
        }
    }
    return msg;
};

// Matchers
// FUTURE: should not be used after endHook()

function defineMatcher(name, fn) {
    Expectation.prototype[name] =
        function () {
            let expectation = this;
            expectation.specification.description.log_(name);
            return fn.apply(expectation, arguments);
        };
    fn.toString = function () {
        return name;
    };
}

// not
defineMatcher('not', function (options) {
    options = options; // just to make jshint happy!
    throw new Failure(this.specification, this, 'not', "not yet implemented");
});

defineMatcher('toBe', function matchToBe (expected, options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || this.actual !== expected) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        let exc = this.raisedException ?
            this.exception : new Failure(
                this.specification, this, 'toBe', arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toEqual', function matchToEqual (expected, options) {
    try {
        Object.assign(this, options || {});
        this.pass = true;
        if ( ! _.isEqual(this.actual, expected) ) {
            this.pass = false;
            if ( this.stopOnFailure ) {
                let exc = this.raisedException ?
                    this.exception : new Failure(
                        this.specification, this, 'toEqual', arguments);
                throw exc;
            }
        }
    } finally {
        run_hook(this, 'match');
    }
    return this;
});

defineMatcher('toBeDefined', function matchToBeDefined (options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || typeof this.actual === 'undefined' ) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        let exc = new Failure(
            this.specification, this, 'toBeDefined', arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeUndefined', function matchToBeUndefined (options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || typeof this.actual !== 'undefined' ) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        let exc = new Failure(
            this.specification, this, 'toBeUndefined', arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeNull', function matchToBeNull (options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || this.actual !== null ) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        let exc = new Failure(
            this.specification, this, 'toBeNull', arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeNaN', function matchToBeNaN (options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || this.actual === this.actual ) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        let exc = new Failure(
            this.specification, this, 'toBeNaN', arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeTruthy', function matchToBeTruthy (options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || !this.actual) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        let exc = new Failure(
            this.specification, this, 'toBeTruthy', arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeFalsy', function matchToBeFalsy (options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if (this.raisedException || !!this.actual) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        let exc = new Failure(
            this.specification, this, 'toBeFalsy', arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toContain', function matchToContain (expected, options) {
    options = options;   // just to make jshint happy!
    expected = expected; // just to make jshint happy!
    throw new Failure(
        this.specification, this, 'toContain', "not yet implemented");
});

defineMatcher('toBeLessThan', function matchToBeLessThan (expected, options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if ( this.raisedException ||
         typeof this.actual === 'undefined' ||
         this.actual >= expected ) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        let exc = new Failure(
            this.specification, this, 'toBeLessThan', arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeGreaterThan',
              function matchToBeGreaterThan (expected, options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    if ( this.raisedException || 
         typeof this.actual === 'undefined' ||
         this.actual <= expected) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        let exc = new Failure(
            this.specification, this, 'toBeGreaterThan', arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeBetween', function matchToBeBetween (min, max, options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
      if ( this.raisedException ||
           typeof this.actual === 'undefined' ||
           this.actual < min ||
           max < this.actual ) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        let exc = new Failure(
            this.specification, this, 'toBeBetween', arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeCloseTo',
              function matchToBeCloseTo (expected, precision, options) {
  try {
    if (precision !== 0) {
      precision = precision || 2;
    }
    let delta = Math.pow(10, -precision) / 2;
    Object.assign(this, options || {});
    this.pass = true;
    if ( this.raisedException || 
         typeof this.actual === 'undefined' ||
         Math.abs(this.actual - expected) > delta ) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        let exc = new Failure(
            this.specification, this, 'toBeCloseTo', arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toMatch', function matchToMatch (regexp, options) {
  try {
    Object.assign(this, options || {});
    this.pass = true;
    regexp = new RegExp(regexp); // Check regexp
    if (this.raisedException || ! regexp.test(this.actual.toString())) {
      this.pass = false;
      if ( this.stopOnFailure ) {
        let exc = new Failure(
            this.specification, this, 'toMatch', arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('transform', function matchTransform (transformer) {
    try {
        if ( typeof transformer === 'function' ||
             transformer instanceof Function ) {
            this.actual = transformer(this.actual);
        }
    } catch (exc) {
        this.raisedException = true;
        this.exception = exc;
        this.pass = false;
        if ( this.stopOnFailure ) {
            let exc = new Failure(
                this.specification, this, 'transform', arguments);
            throw exc;
        }
    } finally {
        run_hook(this, 'match');
    }
    return this;
});

defineMatcher('toBeFunction', function (options) {
  try {
    Object.assign(this, options || {});
    if ( typeof this.actual !== 'undefined' &&
         ( typeof this.actual === 'function' ||
           this.actual instanceof Function ) ) {
      this.pass = true;
    } else {
      this.pass = false;
      if (this.stopOnFailure) {
          let actual = (typeof this.actual === 'undefined') ?
              'undefined' : this.actual;
          throw "Not a function " + actual;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toBeA', function matchToBeA (className, options) {
  try {
    Object.assign(this, options || {});
    this.pass = false;
    if ( typeof this.actual === 'object' ) {
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

defineMatcher('invoke', function matchInvoke () {
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

defineMatcher('toThrow', function matchToThrow () {
  try {
    if (this.raisedException) {
      this.pass = true;
    } else {
      this.pass = false;
      if (this.stopOnFailure) {
        let exc = new Failure(this.specification, this, 'toThrow', arguments);
        throw exc;
      }
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

defineMatcher('toNotThrow', function matchToNotThrow () {
  try {
    if (this.raisedException) {
      this.pass = false;
      if (this.stopOnFailure) {
        let exc = new Failure(this.specification, this, 'toThrow', arguments);
        throw exc;
      }
    } else {
        this.pass = true;
    }
  } finally {
    run_hook(this, 'match');
  }
  return this;
});

/* 
   By default, the `eval` matcher evaluates a string in the current
   context, that is the global environment. If you need a variable 
   to be used within that string, you must install it previously in
   the global environment. Something like:

   global.v = 3;
   expect("v+1").eval().toBe(4);

   Differently from Jasmine, you don't need to wrap an expression that
   throws something in a function to check whether something is
   thrown. Just write:

   expect("throw 3").eval().toThrow();

*/

defineMatcher('eval', function matchEval (context, options) {
  try {
    this.code = this.actual;
    this.actual = undefined;
    options = options || {displayErrors: true};
    if ( context ) {
        this.actual = vm.runInContext(this.code, context, options);
    } else {
        // Evaluate in the current 'global' context:
        this.actual = vm.runInThisContext(this.code, options);
    }
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

// Yasmini may use a specific require function. This will be the case
// for instance, if yasmini is used within a browser and webpacked.
// Attention: I could not make UglifyJS respect the exportation of
// 'require' therefore importers of Yasmini should perform:
//      let yasmini = require('yasmini');
//      yasmini.require = yasmini.yasmini_require;

module.exports = (function () {
    let yasmini_require = function fake_require (moduleName) {
        throw new Error(`Cannot require ${moduleName}`);
    };
    try {
        // try to grasp the current require if any:
        yasmini_require = global.require;
    } catch (e) { /* ignore that error! */ }
    return {
        describe: describe,
        it:       front_it,
        expect:   front_expect,
        fail:     front_fail,
        message:  message,
        yasmini_require: yasmini_require,
        // These classes are provided for hooks providers:
        class: {
            Description:   Description,
            Specification: Specification,
            Expectation:   Expectation,
            Failure:       Failure
        }
    };
})();
module.exports.yasmini = yasmini = module.exports;

// end of yasmini.js
