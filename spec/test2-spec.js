// tests for yasmini.js
// Usage: jasmine spec/test2-spec.js
// jshint jasmine: true

var yasmini = require('../yasmini.js');
var vm = require('vm');

describe("Yasmini library: a light Jasmine framework", function () {
  it("should offer describe", function () {
    var desc = yasmini.describe("Yasmini: should offer describe", function () {
      return 42;
    });
    expect(desc.message).toBe("Yasmini: should offer describe");
    expect(desc.result).toBe(42);
    expect(desc.raisedException).toBe(false);
  });

  it("should offer describe with options", function () {
    var msg = "Yasmini: should offer describe with options";
    var desc = yasmini.describe(msg, function () {
      return 42;
    }, {
      foobar: 33
    });
    expect(desc.foobar).toBe(33);
    expect(desc.message).toBe(msg);
    expect(desc.result).toBe(42);
    expect(desc.raisedException).toBe(false);
  });

  it("should offer describe catching exceptions", function () {
    var msg = "Yasmini: should offer describe catching exceptions";
    var desc = yasmini.describe(msg, function () {
      throw 42;
    });
    expect(desc.message).toBe(msg);
    expect(desc.result).toBeUndefined();
    expect(desc.raisedException).toBe(true);
    expect(desc.exception).toBe(42);
  });

  it("javascript verification that finally resumes a throw", function () {
    var a = 1;
    try {
      try {
        throw 2;
      } catch (exc) {
        a = 3;
        throw exc;
      } finally {
        a = 4;
      }
    } catch (exc2) {
      expect(exc2).toBe(2);
    }
    expect(a).toBe(4);
  });

  it("should offer it", function () {
    var desc = yasmini.describe("Yasmini: should offer it", function () {
      var it1 = yasmini.it("should run it", function () {
        return 33;
      });
      expect(it1.expectationAttempted).toBe(0);
    });
    expect(desc.specifications.length).toBe(1);
    var spec = desc.specifications[0];
    expect(spec.result).toBe(33);
    expect(spec.raisedException).toBe(false);
  });

  it("should offer two it with options", function () {
    var desc = yasmini.describe("Yasmini: should offer two it with options", function () {
      var it1 = yasmini.it("should run it", function () {
        33; // no return
      }, {
        foobar: 35
      });
      expect(it1.foobar).toBe(35);
      var it2 = yasmini.it("should run another it", function () {
        return 34;
      });
      expect(it2).toBeTruthy();
    });
    expect(desc.specifications.length).toBe(2);
    var spec1 = desc.specifications[0];
    expect(spec1.result).toBeUndefined();
    expect(spec1.raisedException).toBe(false);
    var spec2 = desc.specifications[1];
    expect(spec2.result).toBe(34);
    expect(spec2.raisedException).toBe(false);
  });

  it("should offer two it with exception", function () {
    var desc = yasmini.describe("Yasmini: should offer two it with exception", function () {
      var it1 = yasmini.it("should run it", function () {
        throw 33;
      }, {
        stopOnFailure: true
      });
      expect(it1.stopOnFailure).toBe(true);
      yasmini.it("should not run another it", function () {
        return 34;
      });
    });
    expect(desc.specifications.length).toBe(1);
    var spec1 = desc.specifications[0];
    expect(spec1.result).toBeUndefined();
    expect(spec1.raisedException).toBe(true);
    expect(spec1.exception).toBe(33);
  });

  it("should offer expect", function () {
    yasmini.describe("Yasmini: should offer expect", function () {
      var it1 = yasmini.it("should run it", function () {
        var expect1 = yasmini.expect(41).toBe(41);
        expect(expect1).toBeTruthy();
      });
      expect(it1.expectations.length).toBe(1);
      expect(it1.expectations[0].pass).toBe(true);
      expect(it1.expectationAttempted).toBe(1);
      expect(it1.expectationSuccessful).toBe(1);
    });
  });

  it("should offer chained expect", function () {
    yasmini.describe("Yasmini: should offer chained expect", function () {
      var it1 = yasmini.it("should run it", function () {
        yasmini.expect(41).toBe(41).toBe(41);
      });
      expect(it1.expectations.length).toBe(1);
      expect(it1.expectationAttempted).toBe(1);
      expect(it1.expectationSuccessful).toBe(1);
      expect(it1.expectations[0].pass).toBe(true);
    });
  });

  it("should offer multiple expect", function () {
    yasmini.describe("Yasmini: should offer multiple expect", function () {
      var it1 = yasmini.it("should run it", function () {
        yasmini.expect(41).toBe(41);
        yasmini.expect(true).toBe(true);
      });
      expect(it1.expectations.length).toBe(2);
      expect(it1.expectationAttempted).toBe(2);
      expect(it1.expectationSuccessful).toBe(2);
      expect(it1.expectations[0].pass).toBe(true);
      expect(it1.expectations[1].pass).toBe(true);
    });
  });

  it("should offer multiple expect not all true", function () {
    yasmini.describe("Yasmini: should offer multiple expect not all true",
    function () {
      var it1 = yasmini.it("should run it", function () {
        yasmini.expect(41).toBe("euh");
        yasmini.expect(true).toBe(true);
      });
      expect(it1.expectations.length).toBe(2);
      expect(it1.expectationAttempted).toBe(2);
      expect(it1.expectationSuccessful).toBe(1);
      expect(it1.expectations[0].pass).toBe(false);
      expect(it1.expectations[1].pass).toBe(true);
    });
  });

  it("should offer multiple expect not all true with exception", function () {
    yasmini.describe("Yasmini: should offer multiple expect not all true",
    function () {
      var it1 = yasmini.it("should run it", function () {
        yasmini.expect(41).toBe("euh");
        yasmini.expect(true).toBe(true);
      }, {
        stopOnFailure: true
      });
      expect(it1.expectations.length).toBe(1);
      expect(it1.expectationAttempted).toBe(1);
      expect(it1.expectationSuccessful).toBe(1);
      expect(it1.expectations[0].pass).toBe(false);
    });
  });

  it("should offer expect.invoke", function () {
    yasmini.describe("Yasmini: should offer expect.invoke",
    function () {
      var it1 = yasmini.it("should run it", function () {
        var check1 = yasmini.expect(function () {
          return 45;
        }).invoke().toBe(45);
        expect(check1.actual).toBe(45);
      });
      expect(it1.expectations.length).toBe(1);
      expect(it1.expectationAttempted).toBe(1);
      expect(it1.expectationSuccessful).toBe(1);
      expect(it1.expectations[0].pass).toBe(true);
    });
  });

  it("should offer expect.invoke with exception", function () {
    yasmini.describe("Yasmini: should offer expect.invoke with exception",
    function () {
      var it1 = yasmini.it("should run it", function () {
        var check1 = yasmini.expect(function () {
          throw 45;
        }).toThrow();  // implicit try()
        expect(check1.raisedException).toBe(true);
        expect(check1.exception).toBe(45);
        var check2 = yasmini.expect(function () {
          throw 46;
        }).invoke().toThrow(); // explicit try()
        expect(check2.raisedException).toBe(true);
        // 47() throws an exception
        var check3 = yasmini.expect(47).toThrow();
        expect(check3.pass).toBe(true);
        var check4 = yasmini.expect(function () {
          return 47; // don't throw
        }).toThrow();
        expect(check4.pass).toBe(false);
      });
      expect(it1.expectations.length).toBe(4);
      expect(it1.expectationAttempted).toBe(4);
      expect(it1.expectationSuccessful).toBe(3);
      expect(it1.expectations[0].pass).toBe(true);
      expect(it1.expectations[1].pass).toBe(true);
    });
  });

  it("should offer expect.eval", function () {
    yasmini.describe("Yasmini: should offer expect.eval",
    function () {
      var it1 = yasmini.it("should run it", function () {
        var code = "3 * 4";
        var check1 = yasmini.expect(code).eval().toBe(12);
        expect(check1.code).toBe(code);
        expect(check1.actual).toBe(12);
      });
      expect(it1.expectationAttempted).toBe(1);
      expect(it1.expectationSuccessful).toBe(1);
    });
  });

  it("node.js verification", function () {
    var result, exception;
    try {
      result = vm.runInThisContext("throw 66;");
    } catch (exc) {
      exception = exc;
    }
    expect(result).toBeUndefined();
    expect(exception).toBeTruthy();
  });

  it("should offer expect.eval with exceptions", function () {
    yasmini.describe("Yasmini: should offer expect.eval with exceptions",
    function () {
      var it1 = yasmini.it("should run it", function () {
        var code = "(function () { throw 67; })()";
        var check1 = yasmini.expect(code).eval();
        expect(check1.code).toBe(code);
        expect(check1.actual).toBeUndefined();
        expect(check1.raisedException).toBe(true);
      });
      expect(it1.expectationAttempted).toBe(1);
      expect(it1.expectationSuccessful).toBe(0);
    });
  });

}); // end of describe

// end of test2-spec.js
