// Tests using Yasmini without Jasmine

var yasmini = require('yasmini');
//yasmini.load('yasmini-verbalize.js');
require('yasmini/example/verbalizer');
var describe = yasmini.describe,
    it       = yasmini.it,
    expect   = yasmini.expect,
    fail     = yasmini.fail;

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
    }).invoke().toThrow();
    //console.log(e3); // DEBUG
    this.description.verbalization.push('Reached that point');
  }, { // options for specification
        stopOnFailure: true,
        expectationIntended: 3
  });
  console.log(it1);//DEBUG
  var it2 = it("should check previous specification", function () {
    var verbs = e1.specification.description.verbalization;
    expect(verbs.length).toBe(19);
    expect(verbs[10]).toMatch(/Je vais/);
    expect(verbs[12]).toMatch(/Reached that point/);
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
    expect(it1.pass).toBeTruthy();
    expect(it2.raisedException).toBe(false);
  }, {
    verbose: false,
    expectationIntended: 5
  });
}, { // options for description
      verbose: true,
      specificationIntended: 3
});

console.log(d1);
console.log(d1.verbalization);
if ( ! d1.pass ) {
  process.exitCode = 1;
}
