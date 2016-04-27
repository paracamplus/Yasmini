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

This module is loaded with yasmini.load("yasmini-verbose-verbalize.js");
therefore the yasmini global variable is defined. This module
defines the hooks for Expectation, Specification and Description
in order to verbalize what happens during the tests. Verbalization
bubbles up and finishes in Description.verbalization.

*/

// Require this module to encode verbalized strings into regular HTML:
var he = require('he');

// Tailorisable global variables:
yasmini.outputter = console.log;
yasmini.newline = "\n";

// New methods on Yasmini concepts:
yasmini.class.Description.prototype.beginHook = function () {
    yasmini.outputter('[' + he.encode(this.message) + yasmini.newline + " ");
    this.stopOnFailure = true;
};

yasmini.class.Description.prototype.endHook = function () {
    var msg = '';
    if ( this.pass ) {
        msg = ']';
    }
    yasmini.outputter(msg + yasmini.newline);
};

yasmini.class.Specification.prototype.beginHook = function () {
    yasmini.outputter('(' + he.encode(this.message) + yasmini.newline + "  ");
};

yasmini.class.Specification.prototype.endHook = function () {
    var msg = '';
    if ( this.pass ) {
        msg = ')';
    } else {
        var exc = this.exception;
        if ( exc && exc instanceof Failure ) {
            msg = exc.toString();
        }
    }
    yasmini.outputter(msg + yasmini.newline + " ");
};

yasmini.class.Expectation.prototype.endHook = function () {
    yasmini.outputter('.');
};    

// end of yasmini-verbose-verbalizer.js
