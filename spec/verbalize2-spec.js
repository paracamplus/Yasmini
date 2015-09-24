// tests for yasmini.js
// Usage: jasmine spec/verbalize2-spec.js
// jshint jasmine: true

var cx = require('../yasmini.js');

cx.class.Expectation.prototype.beginHook = function () {
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
cx.class.Expectation.prototype.endHook = function () {
  var msg;
  if (! this.pass) {
    msg = "Échec du test #" + this.index +
      " Je n'attendais pas votre résultat: " +
      this.actual;
    this.verbalization.push(msg);
  }
};

cx.class.Specification.prototype.beginHook = function () {
  this.verbalization = [];
};
cx.class.Specification.prototype.endHook = function () {
  var msg = "Vous avez réussi " +
    this.expectationSuccessful +
    " de mes " +
    this.expectationAttempted +
    " tests.";
  this.expectations.forEach(function (expectation) {
    this.verbalization = this.verbalization.concat(expectation.verbalization);
  }, this);
  this.verbalization.push(msg);
};

cx.class.Description.prototype.beginHook = function () {
  this.verbalization = [];
};
cx.class.Description.prototype.endHook = function () {
  this.specifications.forEach(function (spec) {
    this.verbalization = this.verbalization.concat(spec.verbalization);
  }, this);
};

// **************************************** Tests ******************

describe("Verbalization", function () {
  it("should occur", function () {
    var d1 = cx.describe("Tests de verbalization (FR)", function () {
      var c1 = cx.it("additions", function () {
        cx.expect(1+1).toBe(2);
        cx.expect(2+2).toBe(4);
        cx.expect(2+3).toBe(5);
      });
      expect(c1.expectationSuccessful).toBe(3);
    });
    console.log(d1.verbalization);
  });

  it("should occur", function () {
    var d1 = cx.describe("Tests de verbalization (FR)", function () {
      var c1 = cx.it("multiplications", function () {
        cx.expect(1*1, {
          code: "1*1"
        }).toBe(1);
        cx.expect("2*2").eval().toBe(44);
        cx.expect("2*2", {
          stopOnFailure: true
        }).eval().toBe(33);
        cx.expect("2*2").eval().toBe(22);
      });
      expect(c1.expectationSuccessful).toBe(1);
      expect(c1.expectationAttempted).toBe(3);
    }, {
      verbose: true
    });
    console.log(d1.verbalization);
  });
});

// end of verbalize2-spec.js
