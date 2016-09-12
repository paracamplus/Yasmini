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

This module is loaded with require("yasmini/codegradx/verbalizer");
therefore the yasmini global variable is defined. This module
defines the hooks for Expectation, Specification and Description
in order to verbalize what happens during the tests.

*/

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var yasmini = require('yasmini/codegradx/marker');
module.exports = yasmini;

yasmini.class.Expectation.prototype.beginHook = function () {
    // exitCode is initially undefined. We initialize it with 0 as soon
    // as at least one expectation is to be processed:
    if ( ! yasmini.config.exitCode ) {
        yasmini.config.exitCode = 0;
    }
    this.alreadyShownTest = false;
    // Run the endHook of the previous expectation if any:
    var n = this.specification.expectations.length;
    if ( n > 1 ) {
        var previousExpectation = this.specification.expectations[n-2];
        previousExpectation.endHook();
    }
    this.update_();
    yasmini.printPartialResults_();
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
            yasmini.verbalize('+ ', msg);
        }
        this.alreadyShownTest = true;
    }
    this.update_();
    yasmini.printPartialResults_();
};

yasmini.class.Expectation.prototype.endHook = function () {
    if ( ! this.runEndHook ) {
        if (this.pass) {
            //yasmini.verbalize('+ Bravo');
        } else {
            if ( this.raisedException ) {
                msg = yasmini.messagefn(
                    'failException', this.index, this.exception);
            } else {
                msg = yasmini.messagefn('fail', this.index, this.actual);
            }
            yasmini.verbalize('- ', msg);
        }
        this.runEndHook = true;
    }
    this.update_();
    yasmini.printPartialResults_();
};

yasmini.class.Specification.prototype.beginHook = function () {
    var msg = this.message;
    yasmini.verbalize('+ ', msg);
    this.update_();
    yasmini.printPartialResults_();
};

yasmini.class.Specification.prototype.endHook = function () {
    this.update_();
    yasmini.printPartialResults_();
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
    yasmini.verbalize(msg);
};

yasmini.class.Description.prototype.beginHook = function () {
    yasmini.config.descriptions.push(this);
    var msg = "+ " + yasmini.messagefn('checkFunction', this.message);
    yasmini.verbalize(msg);
    this.update_();
    yasmini.printPartialResults_();
};

yasmini.class.Description.prototype.endHook = function () {
    this.update_();
    yasmini.printPartialResults_();
};

// end of yasmini/codegradx/verbalizer.js
