// tests for yasmini.js
// Usage: jasmine spec/verbalize2-spec.js
// jshint jasmine: true

var yasmini = require('../yasmini.js');
yasmini.load('yasmini-verbalize.js');

// **************************************** Tests ******************

describe("Verbalization", function () {
  it("should occur", function () {
    var d1 = yasmini.describe("Tests de verbalization (FR)", function () {
      var c1 = yasmini.it("additions", function () {
        yasmini.expect(1+1).toBe(2);
        yasmini.expect(2+2).toBe(4);
        yasmini.expect(2+3).toBe(5);
      });
      expect(c1.expectationSuccessful).toBe(3);
    });
    console.log(d1.verbalization);
    expect(d1.verbalization.length).toBe(1);
    expect(d1.verbalization[0]).toEqual(jasmine.stringMatching(/3 de mes 3/));
  });

  it("should occur", function () {
    var d1 = yasmini.describe("Tests de verbalization (FR)", function () {
      var c1 = yasmini.it("multiplications", function () {
        yasmini.expect(1*1, {
          code: "1*1"
        }).toBe(1);
        yasmini.expect("2*21").eval().toBe(44);
        yasmini.expect("2*22", {
          stopOnFailure: true
        }).eval().toBe(33);
        yasmini.expect("2*23").eval().toBe(22);
      });
      expect(c1.expectationSuccessful).toBe(1);
      expect(c1.expectationAttempted).toBe(3);
    }, {
      verbose: true
    });
    console.log(d1.verbalization);
    expect(d1.verbalization.length).toBe(6);
    expect(d1.verbalization[2]).toEqual(jasmine.stringMatching(/chec du test #2/));
    expect(d1.verbalization[4]).toEqual(jasmine.stringMatching(/chec du test #3/));
    expect(d1.verbalization[5]).toEqual(jasmine.stringMatching(/1 de mes 3/));
  });
});

// end of verbalize2-spec.js
