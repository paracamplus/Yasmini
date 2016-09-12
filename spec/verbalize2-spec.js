// tests for yasmini.js
// Usage: jasmine spec/verbalize2-spec.js
// jshint jasmine: true

//var yasmini = require('../yasmini.js');
//yasmini.load('yasmini-verbalize.js');
var yasmini = require('yasmini');
require('yasmini/example/verbalizer');
yasmini.lang = 'fr';

// **************************************** Tests ******************

describe("Verbalization", function () {
  it("should occur", function () {
    var d1 = yasmini.describe("Tests de verbalization (FR)1", function () {
      var c1 = yasmini.it("additions", function () {
        yasmini.expect(1+1).toBe(2);
        yasmini.expect("2+2").eval().toBe(4);
        yasmini.expect(2+3).toBe(5);
      });
      expect(c1.expectationSuccessful).toBe(3);
    });
    console.log(d1.verbalization);
    expect(d1.verbalization.length).toBe(16);
    expect(d1.verbalization[14]).toEqual(jasmine.stringMatching(/3 de mes 3/));
  });

  it("should occur", function () {
    var d1 = yasmini.describe("Tests de verbalization (FR)2", function () {
      var c1 = yasmini.it("multiplications", function () {
        yasmini.expect(1*1, {
          code: "1*1"
        }).toBe(1);                             // ok
        yasmini.expect("2*21").eval().toBe(44); // failure expected
        yasmini.expect("2*22", {
          stopOnFailure: true
        }).eval().toBe(33);                     // failure expected
        yasmini.expect("2*23").eval().toBe(22); // not executed
      });
      expect(c1.expectationSuccessful).toBe(1);
      expect(c1.expectationAttempted).toBe(3);
    }, {
      verbose: true
    });
    console.log(d1.verbalization);
    expect(d1.verbalization.length).toBe(21);
    expect(d1.verbalization[15]).toEqual(jasmine.stringMatching(/chec du test #2/));
    expect(d1.verbalization[17]).toEqual(jasmine.stringMatching(/chec du test #3/));
    expect(d1.verbalization[19]).toEqual(jasmine.stringMatching(/1 de mes 3/));
  });
});

// end of verbalize2-spec.js
