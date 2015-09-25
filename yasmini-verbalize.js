// An example of French verbalization for Yasmini

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

This module is loaded with yasmini.load("yasmini-verbalize.js");
therefore the yasmini global variable is defined. This module
defines the hooks for Expectation, Specification and Description
in order to verbalize what happens during the tests. Verbalization
bubbles up and finishes in Description.verbalization.

The `verbose` option produces more verbosity.
*/

yasmini.class.Expectation.prototype.beginHook = function () {
  this.verbalization = [];
  var msg;
  if ( this.verbose ) {
    msg = 'Test #' + this.index + ' ';
  }
  if ( this.code ) {
    msg = (msg || '') + "Je vais évaluer " + this.code;
  }
  if (msg) {
    this.verbalization.push(msg);
  }
};
yasmini.class.Expectation.prototype.endHook = function () {
  var msg;
  if (! this.pass) {
    msg = "Échec du test #" + this.index +
      " Je n'attendais pas votre résultat: " +
      this.actual;
    this.verbalization.push(msg);
  }
};

yasmini.class.Specification.prototype.beginHook = function () {
  this.verbalization = [];
};
yasmini.class.Specification.prototype.endHook = function () {
  var msg = "Vous avez réussi " +
    this.expectationSuccessful +
    " de mes " +
    this.expectationAttempted +
    " tests.";
  // Collect lower verbalization messages:
  this.expectations.forEach(function (expectation) {
    this.verbalization = this.verbalization.concat(expectation.verbalization);
  }, this);
  this.verbalization.push(msg);
};

yasmini.class.Description.prototype.beginHook = function () {
  this.verbalization = [];
};
yasmini.class.Description.prototype.endHook = function () {
  // Collect lower verbalization messages:
  this.specifications.forEach(function (spec) {
    this.verbalization = this.verbalization.concat(spec.verbalization);
  }, this);
};

// end of yasmini-verbalize.js
