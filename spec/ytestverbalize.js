// Yasmini verbalization test in French

let yasmini = require('yasmini/example/verbalizer');

let describe = yasmini.describe,
    it       = yasmini.it,
    expect   = yasmini.expect;

describe("Verbalization", function () {
    it("simple", function () {
        expect(true).toBeTruthy();
        expect(false).toBeFalsy();
        expect(40).toEqual(39);
    });
    it("asynchronous", function (done) {
        expect(41).toBe(41);
        function later () {
            expect(42).toBe(42);
            done();
        }
        setTimeout(later, 200);
    });
}).hence(function (description) {
    console.log(description.verbalization);
});
