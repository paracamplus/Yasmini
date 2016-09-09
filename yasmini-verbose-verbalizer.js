// An example of another verbalization for Yasmini

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

This module is loaded with yasmini.load("yasmini-verbose-verbalizer.js");
therefore the yasmini global variable is defined. This module
defines the hooks for Expectation, Specification and Description
in order to verbalize what happens during the tests. This plugin
is used in the browser with a specific outputter variable that
displays what happens into a DOM node.

The result looks like (with one Description containing one
Specification containing two successful Expectations):

  [min3
   (case a ..)
   ]

*/

// Require this module to encode verbalized strings into regular HTML:
var he = require('he');

// Tailorisable global variables:
yasmini.outputter = console.log;
yasmini.newline = "\n";

// New methods on Yasmini concepts:
yasmini.class.Description.prototype.beginHook = function () {
    yasmini.outputter('[' + he.encode(this.message) + yasmini.newline + " ");
};

yasmini.class.Description.prototype.endHook = function () {
    var msg = '';
    if ( this.exception ) {
        msg = this.exception.toString();
    } else {
        msg = ']';
    }
    yasmini.outputter(msg + yasmini.newline);
};

yasmini.class.Specification.prototype.beginHook = function () {
    this.stopOnFailure = true;
    yasmini.outputter('(' + he.encode(this.message) + " ");
};

yasmini.class.Specification.prototype.endHook = function () {
    var msg = '';
    if ( this.exception ) {
        throw this.exception;
    } else {
        msg = ')';
    }
    yasmini.outputter(msg + yasmini.newline + " ");
};

yasmini.class.Expectation.prototype.endHook = function () {
    if ( this.pass ) {
        yasmini.outputter('.');
    } else {
        yasmini.outputter('!');
    }
};

yasmini.message.en.failure1 = "Failure!\n  the argument of expect() is ";
yasmini.message.en.failure2 = "\n  and does not satisfy ";
 
yasmini.class.Failure.prototype.toString = function () {
    var it = this.expectation;
    var msg = "Failure!\n  the argument of expect() is " +
        it.actual + "\n  and does not satisfy " +
        this.matcher.toString() + '()';
    if ( it.exception ) {
        if ( it.raisedException ) {
            msg += ' raised ' + it.exception;
        } else {
            msg += ' fails with ' + it.exception;
        }
    }
    return msg;
}

// end of yasmini-verbose-verbalizer.js
