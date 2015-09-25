// Tests using Yasmini without Jasmine

var yasmini = require('../yasmini.js');
var describe = yasmini.describe,
    it       = yasmini.it,
    expect   = yasmini.expect;

var d1 = describe("some program", function () {
  var it1 = it("should run this", function () {
    var e1 = expect(2+2).toBe(4);
    var e2 = expect(e1.raisedException, {
      verbose: false
    }).toBe(false);
  }, { // options
        stopOnFailure: true
  });
  expect(it1.expectationAttempted).toBe(it1.expectationSuccessful);
}, { // options
      verbose: true
});
