// An example of French or English verbalization for Yasmini

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

This module is loaded with yasmini.load("yasmini-verbalize.js");
therefore the yasmini global variable is defined. This module
defines the hooks for Expectation, Specification and Description
in order to verbalize what happens during the tests. Verbalization
bubbles up and finishes in Description.verbalization.

*/

let yasmini = require('yasmini');
module.exports = yasmini;

yasmini.lang = 'fr';

yasmini.message = {
    fr: {
        startEval: function (code) {
            return "Je vais évaluer " + code;
        },
        fail: function (index, actual) {
            return "Échec du test #" + index +
                " Je n'attendais pas votre résultat: " + actual;
        },
        fullSuccess: function (expectationSuccessful, expectationAttempted) {
            return "Vous avez réussi " + expectationSuccessful +
                " de mes " + expectationAttempted + " tests.";
        },
        partialSuccess: function (expectationSuccessful, expectationAttempted) {
            return "Vous n'avez réussi que " + expectationSuccessful +
                " de mes " + expectationAttempted + " tests.";
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
        fullSuccess: function (expectationSuccessful, expectationAttempted) {
            return "You pass " + expectationSuccessful + " of my " +
                expectationAttempted + " tests.";
        },
        partialSuccess: function (expectationSuccessful, expectationAttempted) {
            return "You only pass " + expectationSuccessful +
                " of my " + expectationAttempted + " tests.";
        }
    }
};

yasmini.messagefn = function (key) {
    let translator = yasmini.message[yasmini.lang];
    if ( translator ) {
        let fn = translator[key];
        let args = Array.prototype.slice.call(arguments, 1);
        return fn.apply(null, args);
    } else {
        return JSON.stringify(arguments);
    }
};

yasmini.class.Expectation.prototype.beginHook = function () {
  let msg = "run beginHook on expectation #" + this.index;
  this.specification.description.verbalization.push(msg);
  this.alreadyShownTest = false;
};
yasmini.class.Expectation.prototype.matchHook = function () {
  var msg = "run matchHook on expectation #" + this.index;
  this.specification.description.verbalization.push(msg);
  msg = '';
  if ( ! this.alreadyShownTest ) {
    this.alreadyShownTest = true;
    if ( this.verbose ) {
      msg = 'Test #' + this.index + ' ';
    }
    if ( this.code ) {
      msg = (msg || '') + yasmini.messagefn('startEval', this.code);
    }
    if (msg) {
      this.specification.description.verbalization.push(msg);
    }
  }
};
yasmini.class.Expectation.prototype.endHook = function () {
  var msg = "run endHook on expectation #" + this.index;
  this.specification.description.verbalization.push(msg);
  if (! this.pass) {
    msg = yasmini.messagefn('fail', this.index, this.actual);
    this.specification.description.verbalization.push(msg);
  }
};

yasmini.class.Specification.prototype.beginHook = function () {
  let msg = "run beginHook on specification #" + this.message;
  this.description.verbalization.push(msg);
};
yasmini.class.Specification.prototype.endHook = function () {
  var msg = "run endHook on specification #" + this.message;
  this.description.verbalization.push(msg);
  if (this.pass) {
    msg = yasmini.messagefn('fullSuccess', 
                            this.expectationSuccessful,
                            this.expectationAttempted);
  } else {
    msg = yasmini.messagefn('partialSuccess', 
                            this.expectationSuccessful,
                            this.expectationIntended ?
                                this.expectationIntended :
                                this.expectationAttempted );
    }
    this.description.verbalization.push(msg);
  };

yasmini.class.Description.prototype.beginHook = function () {
  let msg = "run beginHook on description #" + this.message;
  this.verbalization = [msg];
};
yasmini.class.Description.prototype.endHook = function () {
  let msg = "run endHook on description #" + this.message;
  this.verbalization.push(msg);
};

// end of yasmini-verbalize.js
