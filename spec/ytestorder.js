// Tests using Yasmini without Jasmine

let yasmini = require('yasmini');
let describe = yasmini.describe,
    it       = yasmini.it,
    expect   = yasmini.expect;

describe("evaluation order", function () {
  console.log(1);
  let it1 = it("specification A", function () {
      console.log(3);
      let e1 = expect(3+1).toBe(4);
      // all properties of e1 are available here
  });
  // Only static properties of it1 available here
  console.log(2);
  it("specification B", function () {
      // All properties of it1 available here
      console.log(4);
      expect(5).toEqual(5);
  });
}).hence(function (description) {
   // All properties of all specifications now available here.
   // The complete description.log can also be inquired.
   // The variable `it1` and `e1` are just present to name objects.
   // since it1 ==== description.specifications[0]
   //   and e1 === it1.expectations[0]
  console.log(5);
  console.log(description.log);
});
