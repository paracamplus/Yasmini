// Tests using Yasmini without Jasmine

var yasmini = require('yasmini');
//yasmini.load('./codegradx/verbalizer.js');
require('yasmini/codegradx/verbalizer');
var describe = yasmini.describe,
    it       = yasmini.it,
    expect   = yasmini.expect;

// Fake a config object:
yasmini.config = {
    descriptions: [],
    journal: [],
    resultFile: "/dev/null"
};

describe("factorial", function () {
    function fact (n) {
        if ( 0 <= n && n <= 1 ) {
            return 1;
        } else {
            return n * fact(n - 1);
        }
    }
    it("factorial for small integers", function () {
        expect(fact(0)).toBe(1);
        expect(fact(1)).toBe(1);
    });
    it("factorial using recursion", function () {
        expect(fact(2)).toBe(2);
        expect(fact(3)).toBe(1*2*3);
    });
    it("factorial fail on negative numbers", function () {
        var step = 0;
        expect(function () {
            // Should throw a stack overflow:
            fact(-1);
            // should not run this:
            step = 1;
        }).toThrow();
        expect(step).toBe(0);
    });
});
