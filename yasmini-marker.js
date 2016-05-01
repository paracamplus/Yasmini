// Some utilities (in French) for CodeGradX.

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

This module is loaded with yasmini.load("yasmini-marker.js");
therefore the yasmini global variable is defined. This module
describes how student's code (and tests) are run and compared to
teacher's code.

*/

var fs = yasmini.imports.fs;
var path = yasmini.imports.path;
var vm = yasmini.imports.vm;
var config;

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
var verbalize = function () {
    var result = '';
    for (var i=0 ; i<arguments.length ; i++) {
      var s = yasmini.imports.util.inspect(arguments[i]);
      s = s.slice(1,-1).replace("\\'", "'"); // remove surrounding quotes!
      result += s;
    }
    config.journal.push(result);
    printPartialResults_();
};

var printPartialResults_ = function () {
    // Recompute attemptedExpectationsCount and succeededExpectationsCount:
    config.attemptedExpectationsCount = 0;
    config.succeededExpectationsCount = 0;
    config.descriptions.forEach(function (desc) {
      config.attemptedExpectationsCount += desc.expectationAttempted;
      config.succeededExpectationsCount += desc.expectationSuccessful;
    });
    var msg = "" +
    "ATTEMPTEDEXPECTATIONSCOUNT=" +
    config.attemptedExpectationsCount +
    "\nSUCCEEDEDEXPECTATIONSCOUNT=" +
    config.succeededExpectationsCount +
    "\nTOTALEXPECTATIONSCOUNT=" +
    config.totalExpectationsCount;
    config.journal.forEach(function (s) {
      msg += "\n# " + s;
    });
    msg += "\n";
    fs.writeFileSync(config.resultFile, msg);
 };

/* Mark student's code.
 * Stop at first failure.
 */

yasmini.markFile = function (config_, codefile, specfile) {
    // Make it global to this module:
    config = config_;

    // Check student's code with its own tests (if any):
    yasmini.load('yasmini-verbose-verbalizer.js');
    yasmini.outputter = function (msg) {
        yasmini.process.stdout.write(msg);
    };
    if ( evalStudentCode_(config, codefile) ) {
        verbalize("+ Votre code s'évalue bien.");
    } else {
        verbalize("- Je m'arrête là!");
        return;
    }

    yasmini.load('yasmini-codegradx-verbalize.js', {
        verbalize: verbalize,
        printPartialResults_: printPartialResults_
    });
    if ( evalStudentTests_(config, specfile) ) {
        
    } else {
        verbalize("- Je m'arrête là!");
        return;
    }
};

/* Check student's code with teacher's tests
 */

var evalStudentTests_ = function (config, specfile) {
    verbalize("+ ", "Je vais maintenant vérifier votre code avec mes tests.");
    var src = fs.readFileSync(specfile);
    // NOTA: this pollutes the current environment with student's functions:
    var current = vm.runInThisContext("this");
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
    verbalize("+ ", "Je vais évaluer votre code.");
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
       console: yasmini.imports.console,
       describe: _describe,
       it:       yasmini.it,
       expect:   yasmini.expect,
       fail:     yasmini.fail
    });
    // Evaluate that file:
    try {
        vm.runInContext(src, config.module, { filename: codefile });
        verbalize("+ Voici ce que j'obtiens:");
        verbalize("# " + config.resultDir + '/s.out');

        // Check that student's code is coherent wrt its own tests:
        var coherent = true;
        config.student.tests.forEach(function (d) {
            coherent = coherent && d.description.pass;
        });
        if ( config.student.tests.length > 0 && ! coherent ) {
            verbalize("-- Votre code ne passe pas vos propres tests!");
            return false;
        }

        // Check that required student's functions are present:
        for (var fname in config.functions) {
            var f = config.module[fname];
            //printerr(f);
            if ( ! ( typeof(f) === 'function' ||
                 f instanceof Function ) ) {
                verbalize("- ", fname, " n'est pas une fonction");
                return false;
            }
        }
    } catch (exc) {
      // Bad syntax or incorrect compilation throw an Error
      var msg = "Votre code n'est pas entièrement satisfaisant: " +
            exc.toString();
      msg = msg.replace(/\n/gm, "\n#");
      verbalize("-- ", msg);
      return false;
    }
    return true;
};

// end of yasmini-marker.js
