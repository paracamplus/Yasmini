// An example of French verbalization for Yasmini used by CodeGradX

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

This module is loaded with yasmini.load("yasmini-codegradx-verbalize.js");
therefore the yasmini global variable is defined. This module
defines the hooks for Expectation, Specification and Description
in order to verbalize what happens during the tests.

*/

var fs = yasmini.imports.fs;
var path = yasmini.imports.path;
var vm = yasmini.imports.vm;
var config = yasmini.config;

yasmini.class.Expectation.prototype.beginHook = function () {
    // exitCode is initially undefined. We initialize it with 0 as soon
    // as at least one expectation is to be processed:
    if ( ! config.exitCode ) {
        config.exitCode = 0;
    }
    this.alreadyShownTest = false;
    // Run the endHook of the previous expectation if any:
    var n = this.specification.expectations.length;
    if ( n > 1 ) {
        var previousExpectation = this.specification.expectations[n-2];
        previousExpectation.endHook();
    }
    this.update_();
    printPartialResults_();
};

yasmini.class.Expectation.prototype.matchHook = function () {
    var msg;
    if ( ! this.alreadyShownTest ) {
        if ( this.verbose ) {
            msg = 'Test #' + this.index + ' ';
        }
        if ( this.code ) {
            msg = (msg || '') + "J'évalue " + this.code;
        }
        if (msg) {
            verbalize('+ ', msg);
        }
        this.alreadyShownTest = true;
    }
    this.update_();
    printPartialResults_();
};

yasmini.class.Expectation.prototype.endHook = function () {
    if ( ! this.runEndHook ) {
        if (this.pass) {
            //verbalize('+ Bravo');
        } else {
            if ( this.raisedException ) {
                msg = "Échec du test #" + this.index +
                    " Exception signalée: " +
                    this.exception;
            } else {
                msg = "Échec du test #" + this.index +
                    " Je n'attendais pas votre résultat: " +
                    this.actual;
            }
            verbalize('- ', msg);
        }
        this.runEndHook = true;
    }
    this.update_();
    printPartialResults_();
};

yasmini.class.Specification.prototype.beginHook = function () {
    var msg = this.message;
    verbalize('+ ', msg);
    this.update_();
    printPartialResults_();
};

yasmini.class.Specification.prototype.endHook = function () {
    this.update_();
    printPartialResults_();
    var msg;
    if (this.pass) {
        // Here expectationAttempted = expectationIntended
        msg = "+ Vous avez réussi " +
            this.expectationSuccessful +
            " de mes " +
            this.expectationAttempted +
            " tests.";
    } else {
        msg = "- Vous n'avez réussi que " +
            this.expectationSuccessful +
            " de mes " +
            (this.expectationIntended ?
             this.expectationIntended :
             this.expectationAttempted ) +
            " tests.";
    }
    verbalize(msg);
};

yasmini.class.Description.prototype.beginHook = function () {
    config.descriptions.push(this);
    var msg = "+ Je vais tester la fonction " + this.message;
    verbalize(msg);
    this.update_();
    printPartialResults_();
};

yasmini.class.Description.prototype.endHook = function () {
    this.update_();
    printPartialResults_();
};

// end of yasmini-codegradx-verbalize.js
