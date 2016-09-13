// Some utilities (in French or English) for CodeGradX.

/*
Copyright (C) 2016 Christian.Queinnec@CodeGradX.org

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

This module is loaded with require("yasmini/codegradx/marker");
therefore the yasmini global variable is defined. This module
describes how student's code (and tests) are run and compared to
teacher's code. This plugin is run within CodeGradX infrastructure to
generate the student's report.

*/

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var yasmini = require('yasmini');
module.exports = yasmini;

// Messages in two languages (fr and en):

yasmini.message = {
    fr: {
        startEval: function (code) {
            return "J'évalue " + code;
        },
        startEvaluation: function () {
            return "Je vais évaluer votre code.";
        },
        finishEval: function () {
            return "Votre code s'évalue bien.";
        },
        stopEval: function () {
            return "Je m'arrête là!";
        },
        startTests: function () {
            return "Je vais maintenant vérifier votre code avec mes tests.";
        },
        failOwnTests: function () {
            return "Votre code ne passe pas vos propres tests!";
        },
        notAFunction: function (fname) {
            return fname, " n'est pas une fonction";
        },
        notSatisfying: function (exc) {
            return "Votre code n'est pas entièrement satisfaisant: " +
                exc.toString();
        },
        bravo: function () {
            return '';
        },
        fail: function (index, actual) {
            return "Échec du test #" + index +
                " Je n'attendais pas votre résultat: " + actual;
        },
        failException: function (index, exception) {
            return "Échec du test #" + index + " Exception signalée: " +
                exception;
        },
        fullSuccess: function (expectationSuccessful, expectationAttempted) {
            return "Vous avez réussi " + expectationSuccessful +
                " de mes " + expectationAttempted + " tests.";
        },
        partialSuccess: function (expectationSuccessful, expectationAttempted) {
            return "Vous n'avez réussi que " + expectationSuccessful +
                " de mes " + expectationAttempted + " tests.";
        },
        checkFunction: function (message) {
            return "Je vais tester la fonction " + message;
        }
    },
    en: {
        startEval: function (code) {
            return "Evaluating " + code;
        },
        startEvaluation: function () {
            return "Let's start to evaluate your code.";
        },
        finishEval: function () {
            return "Your code has been correctly loaded.";
        },
        stopEval: function () {
            return "I stop here!";
        },
        startTests: function () {
            return "I'm going to check your code with my tests.";
        },
        failOwnTests: function () {
            return "Your code does not pass your own tests!";
        },
        notAFunction: function (fname) {
            return fname, " is not a function!";
        },
        notSatisfying: function (exc) {
            return "Your code is not correct, it raises: " +
                exc.toString();
        },
        bravo: function () {
            return '';
        },
        fail: function (index, actual) {
            return "Failed test #" + index +
                " I was not expecting your result: " + actual;
        },
        failException: function (index, exception) {
            return "Failed test #" + index + " Exception is: " +
                exception;
        },
        fullSuccess: function (expectationSuccessful, expectationAttempted) {
            return "You pass " + expectationSuccessful + " of my " +
                expectationAttempted + " tests.";
        },
        partialSuccess: function (expectationSuccessful, expectationAttempted) {
            return "You only pass " + expectationSuccessful +
                " of my " + expectationAttempted + " tests.";
        },
        checkFunction: function (message) {
            return "I'm going to check function " + message;
        }
    }
};

yasmini.messagefn = function (key) {
    var translator = yasmini.message[yasmini.lang || 'fr'];
    if ( translator ) {
        var fn = translator[key];
        if ( fn ) {
            var args = Array.prototype.slice.call(arguments, 1);
            return fn.apply(null, args);
        } else {
            return key;
        }
    } else {
        return JSON.stringify(arguments);
    }
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

/**
 * verbalize some facts.
 * @param Configuration config
 * @param Any...        message fragments
 */
yasmini.verbalize = function () {
    var result = '';
    for (var i=0 ; i<arguments.length ; i++) {
      var s = yasmini.imports.util.inspect(arguments[i]);
      s = s.slice(1,-1).replace("\\'", "'"); // remove surrounding quotes!
      result += s;
    }
    yasmini.config.journal.push(result);
    yasmini.printPartialResults_();
};

/** 
 * Record the current state of the tests in a file. This is needed by
 * CodeGradX since tests might be interrupted abruptly if lasting too
 * long. In that case, we want to know how far we tested.
 */
yasmini.printPartialResults_ = function () {
    // Recompute attemptedExpectationsCount and succeededExpectationsCount:
    yasmini.config.attemptedExpectationsCount = 0;
    yasmini.config.succeededExpectationsCount = 0;
    yasmini.config.descriptions.forEach(function (desc) {
      yasmini.config.attemptedExpectationsCount += desc.expectationAttempted;
      yasmini.config.succeededExpectationsCount += desc.expectationSuccessful;
    });
    var msg = "" +
    "ATTEMPTEDEXPECTATIONSCOUNT=" +
    yasmini.config.attemptedExpectationsCount +
    "\nSUCCEEDEDEXPECTATIONSCOUNT=" +
    yasmini.config.succeededExpectationsCount +
    "\nTOTALEXPECTATIONSCOUNT=" +
    yasmini.config.totalExpectationsCount;
    yasmini.config.journal.forEach(function (s) {
      msg += "\n# " + s;
    });
    msg += "\n";
    fs.writeFileSync(yasmini.config.resultFile, msg);
 };

/* Mark student's code.
 * Stop at first failure.
 */

yasmini.markFile = function (config, codefile, specfile) {
    // Make it global to this module:
    yasmini.config = config;

    // Check student's code with its own tests (if any):
    require('yasmini/codegradx/verbalizer');
    yasmini.outputter = function (msg) {
        yasmini.process.stdout.write(msg);
    };
    if ( evalStudentCode_(config, codefile) ) {
        yasmini.verbalize("+ ", yasmini.messagefn('finishEval'));
    } else {
        yasmini.verbalize("- ", yasmini.messagefn('stopEval'));
        return;
    }
    if ( ! evalStudentTests_(config, specfile) ) {
        yasmini.verbalize("- ", yasmini.messagefn('stopEval'));
        return;
    }
};

/* Check student's code with teacher's tests
 */

var evalStudentTests_ = function (config, specfile) {
    yasmini.verbalize("+ ", yasmini.messagefn('startTests'));
    var src = fs.readFileSync(specfile);
    // NOTA: this pollutes the current environment with student's functions:
    //var current = vm.runInThisContext("this");
    var current = yasmini.global;
    enrich(current, config.module, {
        yasmini:   yasmini,
        describe:  yasmini.describe,
        it:        yasmini.it,
        expect:    yasmini.expect,
        require:   yasmini.imports.module.require
    });
    vm.runInNewContext(src, current);
    return true;
}

/* Eval student's code.
 * Grab functions the exercise asked for, 
 * grab also the descriptions (the unit tests the student wrote).
 * return false to stop the marking process.
*/

var evalStudentCode_ = function (config, codefile) {
    var msg;
    yasmini.verbalize("+ ", yasmini.messagefn('startEvaluation'));
    // accumulate student's describe() invocations:
    config.student = {
        tests: []
    };
    function _describe (msg, fn) {
        var desc = { msg: msg, fn: fn, description: undefined };
        config.student.tests.push(desc);
        function fnx () {
            desc.description = this;
            return fn.call(this);
        }
        return yasmini.describe(msg, fnx);
    }
    var src = fs.readFileSync(codefile);
    config.module = vm.createContext({
       // allow student's code to require some Node modules:
       require: yasmini.imports.module.require,
       yasmini: yasmini,
       console: yasmini.imports.console,
       describe: _describe,
       it:       yasmini.it,
       expect:   yasmini.expect,
       fail:     yasmini.fail       
    });
    // Evaluate that file:
    try {
        vm.runInContext(src, config.module, { filename: codefile });
        // sometimes there is no output, maybe adapt this message:
        //yasmini.verbalize("+ Voici ce que j'obtiens:");
        //yasmini.verbalize("# " + config.resultDir + '/s.out');

        // Check that student's code is coherent wrt its own tests:
        var coherent = true;
        config.student.tests.forEach(function (d) {
            coherent = coherent && d.description.pass;
        });
        if ( config.student.tests.length > 0 && ! coherent ) {
            yasmini.verbalize("-- ", yasmini.messagefn('failOwnTests'));
            return false;
        }

        // Check that required student's functions are present:
        for (var fname in config.functions) {
            var f = config.module[fname];
            //printerr(f);
            if ( ! ( typeof(f) === 'function' ||
                 f instanceof Function ) ) {
                yasmini.verbalize("- ", yasmini.messagefn('notAFunction', fname));
                return false;
            }
        }
    } catch (exc) {
      // Bad syntax or incorrect compilation throw an Error
      var msg = yasmini.messagefn('notSatisfying', exc);
      msg = msg.replace(/\n/gm, "\n#");
      yasmini.verbalize("-- ", msg);
      return false;
    }
    return true;
};

// end of yasmini/codegrax/marker.js
