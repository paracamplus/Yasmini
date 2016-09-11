// An example of French or English verbalization for Yasmini used by CodeGradX

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

This module is loaded with yasmini.load("yasmini-codegradx-verbalize.js");
therefore the yasmini global variable is defined. This module
defines the hooks for Expectation, Specification and Description
in order to verbalize what happens during the tests.

*/

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var config = yasmini.config;

yasmini.message = {
    fr: {
        startEval: function (code) {
            return "Je vais évaluer " + code;
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
        checkFunction: function (msg) {
            return "Je vais tester la fonction " + message;
        }
    },
    en: {
        startEval: function (code) {
            return "I am going to eval " + code;
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
        checkFunction: function (msg) {
            return "I'm going to check function " + message;
        }
    }
};

yasmini.messagefn = function (key) {
    var translator = yasmini.message[yasmini.lang || 'fr'];
    if ( translator ) {
        var fn = translator[key];
        var args = arguments.slice(1);
        return fn.apply(null, args);
    } else {
        return JSON.stringify(arguments);
    }
}

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
            msg = (msg || '') + yasmini.messagefn('startEval', this.code);
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
                msg = yasmini.messagefn(
                    'failException', this.index, this.exception);
            } else {
                msg = yasmini.messagefn('fail', this.index, this.actual);
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
        msg = "+ " + yasmini.messagefn('fullSuccess', 
                                       this.expectationSuccessful, 
                                       this.expectationAttempted);
    } else {
        msg = "- " + yasmini.messagefn(
            'partialSuccess',
            this.expectationSuccessful,
            (this.expectationIntended ?
             this.expectationIntended :
             this.expectationAttempted ));
    }
    verbalize(msg);
};

yasmini.class.Description.prototype.beginHook = function () {
    config.descriptions.push(this);
    var msg = "+ " + yasmini.messagefn('checkFunction', this.message);
    verbalize(msg);
    this.update_();
    printPartialResults_();
};

yasmini.class.Description.prototype.endHook = function () {
    this.update_();
    printPartialResults_();
};

// end of yasmini-codegradx-verbalize.js
