// Tests using Yasmini without Jasmine

var yasmini = require('../yasmini.js');
var describe = yasmini.describe,
    it       = yasmini.it,
    expect   = yasmini.expect;
yasmini.load('yasmini-verbalize.js');

var d1 = describe("some program", function () {
  var e1, e3;
  var it1 = it("should run this entirely", function () {
    e1 = expect('2+2').eval().toBe(4);
    //console.log(e1); // DEBUG
    expect(e1.raisedException, {
      // options for expectation
      verbose: false
    }).toBe(false);
    //console.log(e2); // DEBUG
    e3 = expect(function () { throw 33; }, {
      // options
      stopOnFailure: false,
      code: "throw 33"
    }).toThrow();
    e1.verbalization.push('Reached that point');
  }, { // options for specification
        stopOnFailure: true,
        expectationIntended: 3
  });
  var it2 = it("should check previous specification", function () {
    expect(e1.verbalization.length).toBe(2);
    expect(e1.verbalization[0]).toMatch(/Reached that point/);
    expect(e1.verbalization[1]).toMatch(/Je vais/);
    expect(e3.raisedException).toBe(true);
    //console.log(it1); // DEBUG
    expect(it1.raisedException).toBe(false);
    expect(it1.expectationAttempted).toBe(it1.expectationSuccessful).toBe(3);
  }, {
    expectationIntended: 6
  });
  it("should still check some facts", function () {
    expect(it2.pass).toBeTruthy();
    expect(it2.pass).toBe(true);
    expect(it2.expectationAttempted).toBe(it2.expectationSuccessful).toBe(6);
    expect(it1.description.pass).toBeTruthy();
    expect(it2.raisedException).toBe(false);
  }, {
    verbose: false,
    expectationIntended: 5
  });
}, { // options for description
      verbose: true,
      specificationIntended: 3
});
console.log(d1.verbalization);
if ( ! d1.pass ) {
  process.exitCode = 1;
}
