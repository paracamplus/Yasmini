// tests for yasmini.js
// Usage: jasmine spec/test2-spec.js
// jshint jasmine: true

var yasmini = require('../yasmini.js');
var vm = require('vm');

describe("Yasmini library: a light Jasmine framework", function () {
    
  it("should offer describe", function () {
      var desc = yasmini.describe("Yasmini: should offer describe",
                                  function () {
          return 42;
      });
      expect(desc.message).toBe("Yasmini: should offer describe");
      expect(desc.result).toBe(42);
      expect(desc.raisedException).toBe(false);
      //console.log(desc.log);
  });

  it("should offer describe (as a Promise)", function (done) {
    yasmini.describe("Yasmini: should offer describe",
      function () {
          return 42;
      }).hence(function (desc) {
          //console.log(desc);
          expect(desc.message).toBe("Yasmini: should offer describe");
          expect(desc.result).toBe(42);
          expect(desc.raisedException).toBe(false);
          //console.log(desc.log);
          done();
      });
  });
    
  it("should offer describe with options", function (done) {
    var msg = "Yasmini: should offer describe with options";
    yasmini.describe(msg, function () {
      return 42;
    }, {
      foobar: 33
    }).hence(function (desc) {
        expect(desc.foobar).toBe(33);
        expect(desc.message).toBe(msg);
        expect(desc.result).toBe(42);
        //console.log(desc.log);
        expect(desc.raisedException).toBe(false);
        done();
    });
  });

  it("should offer describe catching exceptions", function (done) {
    var msg = "Yasmini: should offer describe catching exceptions";
    yasmini.describe(msg, function () {
      throw 42;
    }).hence(function (desc) {
        expect(desc.message).toBe(msg);
        expect(desc.result).toBeUndefined();
        expect(desc.raisedException).toBe(true);
        expect(desc.exception).toBe(42);
        //console.log(desc.log);
        done();
    });
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

  it("should offer it", function (done) {
    var it1;
    yasmini.describe("Yasmini: should offer it", function () {
        it1 = yasmini.it("should run it", function () {
        return 33;
      });
    }).hence(function (desc) {
        expect(it1.expectationAttempted).toBe(0);
        expect(desc.specifications.length).toBe(1);
        var spec = desc.specifications[0];
        expect(spec.result).toBe(33);
        expect(spec.raisedException).toBe(false);
        //console.log(desc.log);
        done();
    });
  });

  it("should offer two it with options", function (done) {
    var it1, it2;
    yasmini.describe("Yasmini: should offer two it with options", 
    function () {
        it1 = yasmini.it("should run it", function () {
            33; // no return
        }, {
            foobar: 35
        });
        it2 = yasmini.it("should run another it", function () {
            return 34;
        });
    }).hence(function (desc) {
        expect(it1.foobar).toBe(35);
        expect(it2).toBeTruthy();
        expect(desc.specifications.length).toBe(2);
        var spec1 = desc.specifications[0];
        expect(spec1.result).toBeUndefined();
        expect(spec1.raisedException).toBe(false);
        var spec2 = desc.specifications[1];
        expect(spec2.result).toBe(34);
        expect(spec2.raisedException).toBe(false);
        //console.log(desc.log);
        done();
    });
  });

  it("should offer two it with exception", function (done) {
    yasmini.describe("Yasmini: should offer two it with exception",
      function () {
      var it1 = yasmini.it("should run it", function () {
        throw 33;
      }, {
        stopOnFailure: true
      });
      expect(it1.stopOnFailure).toBe(true);
      yasmini.it("should not run another it", function () {
        return 34;
      });
    }).hence(function (desc) {
        expect(desc.specifications.length).toBe(2);
        var spec1 = desc.specifications[0];
        expect(spec1.result).toBeUndefined();
        expect(spec1.raisedException).toBe(true);
        expect(spec1.exception).toBe(33);
        //console.log(desc.log);
        done();
    });
  });

  it("should offer expect", function (done) {
    var it1;
    yasmini.describe("Yasmini: should offer expect", function () {
      it1 = yasmini.it("should run it", function () {
        var expect1 = yasmini.expect(41).toBe(41);
        expect(expect1).toBeTruthy();
      });
    }).hence(function (desc) {
        expect(it1.expectations.length).toBe(1);
        expect(it1.expectations[0].pass).toBe(true);
        expect(it1.expectationAttempted).toBe(1);
        expect(it1.expectationSuccessful).toBe(1);
        //console.log(desc.log);
        done();
    });
  });

    it("should offer chained expect", function (done) {
        yasmini.describe("Yasmini: should offer chained expect",
             function () {
                 yasmini.it("should run it", function () {
                     yasmini.expect(41).toBe(41).toBe(41);
                 });
             }).hence(function (desc) {
                 var it1 = desc.specifications[0];
                 expect(it1.expectations.length).toBe(1);
                 expect(it1.expectationAttempted).toBe(1);
                 expect(it1.expectationSuccessful).toBe(1);
                 expect(it1.expectations[0].pass).toBe(true);
                 done();
             });
    });

    it("should offer multiple expect", function (done) {
      yasmini.describe("Yasmini: should offer multiple expect",
                                  function () {
            yasmini.it("should run it", function () {
              yasmini.expect(41).toBe(41);
              yasmini.expect(true).toBe(true);
          });
      }).hence(function (desc) {
            var it1 = desc.specifications[0];
            expect(it1.expectations.length).toBe(2);
            expect(it1.expectationAttempted).toBe(2);
            expect(it1.expectationSuccessful).toBe(2);
            expect(it1.expectations[0].pass).toBe(true);
            expect(it1.expectations[1].pass).toBe(true);
            done();
        });
    });

  it("should offer multiple expect not all true", function (done) {
    yasmini.describe("Yasmini: should offer multiple expect not all true",
    function () {
      yasmini.it("should run it", function () {
        yasmini.expect(41).toBe("euh");
        yasmini.expect(true).toBe(true);
      });
    }).hence(function (desc) {
        var it1 = desc.specifications[0];
        expect(it1.expectations.length).toBe(2);
        expect(it1.expectationAttempted).toBe(2);
        expect(it1.expectationSuccessful).toBe(1);
        expect(it1.expectations[0].pass).toBe(false);
        expect(it1.expectations[1].pass).toBe(true);
        done();
    });
  });

  it("should offer multiple expect not all true with exception", 
  function (done) {
    var it1, it11;
    yasmini.describe("Yasmini: should offer multiple expect not all true",
    function () {
        var desc1 = this;
        expect(desc1 instanceof yasmini.class.Description);
        it11 = yasmini.it("should run it", function () {
                it1 = this;
                expect(it1 instanceof yasmini.class.Specification);
                yasmini.expect(41).toBe("euh");
                fail('should not arrive here!');
        }, {
                stopOnFailure: true
        });
    }).hence(function () {
          expect(it11).toBeDefined();
          expect(it1.expectations.length).toBe(1);
          expect(it1.expectationAttempted).toBe(1);
          expect(it1.expectationSuccessful).toBe(0);
          expect(it1.expectations[0].pass).toBe(false);
          expect(it1.expectations[0].raisedException).toBe(false);
          expect(it1.raisedException).toBe(true);
          var error = it1.exception;
          expect(error.expectation).toBe(it1.expectations[0]);
          expect(error.expectation.actual).toBe(41);
          expect(error.matcherName).toBe('toBe');
          //console.log(error.toString());
          expect(error.toString()).toMatch(/expect\(41\).toBe/);
          expect(error.args[0]).toBe('euh');
          expect(error instanceof yasmini.class.Failure).toBe(true);
          expect(error instanceof Error).toBe(true);
          //console.log(desc.log);
          done();
      });
  });

  it("should offer fail()", function () {
      var ydesc, step = 0;
      yasmini.describe("Yasmini: should offer fail()", 
      function () {
          ydesc = this;
          yasmini.it("explicit call to fail", 
          function () {
              yasmini.expect(function () {
                  yasmini.fail("should fail here!");
                  step = 1;
              }).toThrow();
          });
      });
      expect(step).toBe(0);
      //console.log(ydesc);
  });

  it("should also offer fail()", function () {
    var ydesc, step = 0;
    yasmini.describe("Yasmini: should offer fail()", 
      function () {
          function shouldFail () {
              // will provoke: RangeError: Maximum call stack size exceeded
              return 3 * shouldFail();
          }
          ydesc = this;
          yasmini.it("explicit call to fail", 
          function () {
              expect(function () {
                  shouldFail();
                  step = 1;
                  fail("should not arrive here!");
              }).toThrow();
          });
      });
      expect(step).toBe(0);
      //console.log(ydesc);
  });

  it("should offer .toThrow", function () {
      yasmini.describe("Yasmini: should offer .toThrow", function () {
          var it1 = yasmini.it("check .not", function () {
              var check1 = yasmini.expect("4%a").eval().toThrow();
              expect(check1.pass).toBe(true);
          });
      });
  });
    
  it("should offer .toNotThrow", function () {
      yasmini.describe("Yasmini: should offer .toNotThrow", function () {
          var it1 = yasmini.it("check regular", function () {
              var check1 = yasmini.expect("4+1").eval().toNotThrow();
              expect(check1.pass).toBe(true);
          });
      });
  });

  it("should not offer .not", function (done) {
    var it1;
    yasmini.describe("Yasmini: should not offer .not", 
    function () {
      it1 = yasmini.it("check .not", function () {
         var check1 = yasmini.expect(44).not.toBe(1);
         expect(check1.pass).toBe(false);
      });
    }).hence(function () {
      expect(it1.expectations.length).toBe(1);
      expect(it1.expectationAttempted).toBe(1);
      expect(it1.expectationSuccessful).toBe(0);
      expect(it1.expectations[0].pass).toBe(false);
      done();
    });
  });

  it("should offer .toBeDefined", function (done) {
    var it1;
    yasmini.describe("Yasmini: should offer .toBeDefined", 
    function () {
      it1 = yasmini.it("check .toBeDefined", function () {
         var check1 = yasmini.expect(44).toBeDefined();
         expect(check1.pass).toBe(true);
         var check2 = yasmini.expect(null).toBeDefined();
         expect(check2.pass).toBe(true);
      });
    }).promise.then(function () {
      expect(it1.expectations.length).toBe(2);
      expect(it1.expectationAttempted).toBe(2);
      expect(it1.expectationSuccessful).toBe(2);
      expect(it1.expectations[0].pass).toBe(true);
      expect(it1.expectations[1].pass).toBe(true);
      done();
    });
  });

  it("should offer .toBeUndefined", function () {
    yasmini.describe("Yasmini: should offer .toBeUndefined", 
    function () {
      var it1 = yasmini.it("check .toBeUndefined", function () {
         var check0 = yasmini.expect(undefined).toBeDefined();
         expect(check0.pass).toBe(false);
         var check1 = yasmini.expect(undefined).toBeUndefined();
         expect(check1.pass).toBe(true);
         var check1 = yasmini.expect(3).toBeUndefined();
         expect(check1.pass).toBe(false);
      }).hence(function (desc) {
          var it1 = desc.specifications[0];
          expect(it1.expectations.length).toBe(3);
          expect(it1.expectationAttempted).toBe(3);
          expect(it1.expectationSuccessful).toBe(1);
      });
    });
  });

  it("should offer .toBeNull", function () {
    yasmini.describe("Yasmini: should offer .toBeNull", 
    function () {
      var it1 = yasmini.it("check .toBeNull", function () {
         var check1 = yasmini.expect(44).toBeNull();
         expect(check1.pass).toBe(false);
         var check2 = yasmini.expect(null).toBeNull();
         expect(check2.pass).toBe(true);
      }).hence(function (desc) {
          var it1 = desc.specifications[0];
          expect(it1.expectations.length).toBe(2);
          expect(it1.expectationAttempted).toBe(2);
          expect(it1.expectationSuccessful).toBe(1);
          expect(it1.expectations[0].pass).toBe(false);
          expect(it1.expectations[1].pass).toBe(true);
      });
    });
  });

  it("should offer .toBeNaN", function () {
    yasmini.describe("Yasmini: should offer .toBeNaN", 
    function () {
      var it1 = yasmini.it("check .toBeNaN", function () {
         var check0 = yasmini.expect(undefined).toBeNaN();
         expect(check0.pass).toBe(false);
         var check1 = yasmini.expect(0/0).toBeNaN();
         expect(check1.pass).toBe(true);
         var check2 = yasmini.expect(1/0).toBeNaN();
         expect(check2.pass).toBe(false);
      }).hence(function (desc) {
          var it1 = desc.specifications[0];
          expect(it1.expectations.length).toBe(3);
          expect(it1.expectationAttempted).toBe(3);
          expect(it1.expectationSuccessful).toBe(1);
          expect(it1.expectations[1].pass).toBe(true);
      });
    });
  });

  it("should offer .toBeGreaterThan", function () {
    yasmini.describe("Yasmini: should offer .toBeGreaterThan", 
    function () {
      var it1 = yasmini.it("check .toBeGreaterThan", function () {
         var check0 = yasmini.expect(3).toBeGreaterThan(4);
         expect(check0.pass).toBe(false);
         var check1 = yasmini.expect(3).toBeGreaterThan(2);
         expect(check1.pass).toBe(true);
         var check2 = yasmini.expect(3).toBeGreaterThan(3);
         expect(check2.pass).toBe(false);
      }).hence(function (desc) {
          var it1 = desc.specifications[0];
          expect(it1.expectations.length).toBe(3);
          expect(it1.expectationAttempted).toBe(3);
          expect(it1.expectationSuccessful).toBe(1);
          expect(it1.expectations[1].pass).toBe(true);
      });
    });
  });

  it("should offer .toBeLessThan", function () {
    yasmini.describe("Yasmini: should offer .toBeLessThan", 
    function () {
      var it1 = yasmini.it("check .toBeLessThan", function () {
         var check0 = yasmini.expect(3).toBeLessThan(4);
         expect(check0.pass).toBe(true);
         var check1 = yasmini.expect(3).toBeLessThan(2);
         expect(check1.pass).toBe(false);
         var check2 = yasmini.expect(3).toBeLessThan(3);
         expect(check2.pass).toBe(false);
      }).hence(function (desc) {
          var it1 = desc.specifications[0];
          expect(it1.expectations.length).toBe(3);
          expect(it1.expectationAttempted).toBe(3);
          expect(it1.expectationSuccessful).toBe(1);
          expect(it1.expectations[0].pass).toBe(true);
      });
    });
  });

  it("should offer .toBeBetween", function () {
    yasmini.describe("Yasmini: should offer .toBeBetween", 
    function () {
      var it1 = yasmini.it("check .toBeBetween", function () {
          var check01 = yasmini.expect(3).toBeBetween(1, 4);
          expect(check01.pass).toBe(true);
          var check02 = yasmini.expect(3).toBeBetween(1, 3);
          expect(check02.pass).toBe(true);
          var check03 = yasmini.expect(3).toBeBetween(3, 4);
          expect(check03.pass).toBe(true);
          var check1 = yasmini.expect(3).toBeBetween(1, 2);
          expect(check1.pass).toBe(false);
          var check2 = yasmini.expect(3).toBeBetween(3.1, 4);
          expect(check2.pass).toBe(false);
      }).hence(function (desc) {
          var it1 = desc.specifications[0];
          expect(it1.expectations.length).toBe(5);
          expect(it1.expectationAttempted).toBe(5);
          expect(it1.expectationSuccessful).toBe(3);
          expect(it1.expectations[0].pass).toBe(true);
      });
    });
  });
    
  it("should offer .toBeCloseTo", function () {
    yasmini.describe("Yasmini: should offer .toBeCloseTo", 
    function () {
      var it1 = yasmini.it("check .toBeCloseTo", function () {
         var check0 = yasmini.expect(3).toBeCloseTo(3.4,1);
         expect(check0.pass).toBe(false);
         var check1 = yasmini.expect(3).toBeCloseTo(3.04,1);
         expect(check1.pass).toBe(true);
         var check2 = yasmini.expect(3).toBeCloseTo(3.04,2);
         expect(check2.pass).toBe(false);
         var check3 = yasmini.expect(3.03).toBeCloseTo(3.037,1);
         expect(check3.pass).toBe(true);
      }).hence(function (desc) {
          var it1 = desc.specifications[0];
          expect(it1.expectations.length).toBe(4);
          expect(it1.expectationAttempted).toBe(4);
          expect(it1.expectationSuccessful).toBe(2);
          expect(it1.expectations[1].pass).toBe(true);
      });
    });
  });

  it("should offer .toEqual", function () {
      yasmini.describe("Yasmini: should offer .toEqual",
      function () {
          var it1 = yasmini.it("check .toEqual", function () {
              var check0 = yasmini.expect(3).toEqual(3);
              expect(check0.pass).toBeTruthy();
              check0 = yasmini.expect(undefined).toEqual(undefined);
              expect(check0.pass).toBeTruthy();
              check0 = yasmini.expect({a: 1}).toEqual({a: 1});
              expect(check0.pass).toBeTruthy();
              check0 = yasmini.expect([1, 2, 3]).toEqual([1, 2, 3]);
              expect(check0.pass).toBeTruthy();
              check0 = yasmini.expect(['a']).toEqual(['a']);
              expect(check0.pass).toBeTruthy();
              check0 = yasmini.expect(expect).toEqual(expect);
              expect(check0.pass).toBeTruthy();
              check0 = yasmini.expect([{a: 2}]).toEqual([{a: 2}]);
              expect(check0.pass).toBeTruthy();
              check0 = yasmini.expect(null).toEqual(null);
              expect(check0.pass).toBeTruthy();
          });
      }).hence(function (desc) {
          var it1 = desc.specifications[0];
          expect(it1.expectations.length).toBe(8);
          expect(it1.expectationAttempted).toBe(8);
          expect(it1.expectationSuccessful).toBe(8);
          expect(it1.expectations[1].pass).toBe(true);
      });
  });

  it("should offer .transform", function () {
      yasmini.describe("Yasmini: should offer expect.transform",
      function () {
          function double (n) { return 2*n; }
          function throwX (n) { throw 34; }
          var it1 = yasmini.it("should run it", function () {
              var check1 = yasmini.expect(33).transform(double).toBe(66);
              expect(check1.actual).toBe(66);
              var check2 = yasmini.expect(34).transform(throwX);
              expect(check2.actual).toBe(34);
              expect(check2.pass).toBeFalsy();
          }).hence(function (desc) {
          var it1 = desc.specifications[0];
          expect(it1.expectations.length).toBe(2);
          expect(it1.expectationAttempted).toBe(2);
          expect(it1.expectationSuccessful).toBe(2);
          expect(it1.expectations[0].pass).toBe(true);
          expect(it1.expectations[1].pass).toBe(false);
      });
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
      }).hence(function(desc) {
          var it1 = desc.specifications[0];
          expect(it1.expectations.length).toBe(1);
          expect(it1.expectationAttempted).toBe(1);
          expect(it1.expectationSuccessful).toBe(1);
          expect(it1.expectations[0].pass).toBe(true);
      });
    });
  });

  it("first spec fails", function () {
      yasmini.describe("Yasmini: first spec fails", function () {
          yasmini.it("immediately fails", function () {
              yasmini.expect(3 - "foo").toBe(123);
          });
      }).hence(function (desc) {
          //console.log(desc.log);
          expect(desc.specifications.length).toBe(1);
          var it = desc.specifications[0];
          expect(it.pass).toBeFalsy();
          expect(it.expectations.length).toBe(1);
          expect(it.expectations[0].pass).toBeFalsy();
      });
  });

  it("should offer expect.invoke with exception", function () {
    yasmini.describe("Yasmini: should offer expect.invoke with exception",
    function () {
      var it1 = yasmini.it("should run it", function () {
        var check1 = yasmini.expect(function () {
          throw 45;
        }).invoke().toThrow();  // implicit try()
        expect(check1.raisedException).toBe(true);
        expect(check1.exception).toBe(45);
        // 47() throws an exception
        var check3 = yasmini.expect(47).invoke().toThrow();
        expect(check3.pass).toBe(true);
        var check4 = yasmini.expect(function () {
          return 47; // don't throw
        }).toThrow();
        expect(check4.pass).toBe(false);
      });
    }).hence(function (desc) {
        var it1 = desc.specifications[0];
        expect(it1.expectations.length).toBe(3);
        expect(it1.expectationAttempted).toBe(3);
        expect(it1.expectationSuccessful).toBe(2);
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
      var it2 = yasmini.it("should use global", function () {
          var code = "3 * varXYZ";
          global.varXYZ = 2;
          var check2 = yasmini.expect(code).eval().toBe(6);
          expect(check2.code).toBe(code);
          expect(check2.actual).toBe(6);
      });
    }).hence(function (desc) {
        expect(desc.specifications.length).toBe(2);
        var it1 = desc.specifications[0];
        expect(it1.expectationAttempted).toBe(1);
        expect(it1.expectationSuccessful).toBe(1);
        var it2 = desc.specifications[1];
        expect(it2.expectationAttempted).toBe(1);
        expect(it2.expectationSuccessful).toBe(1);
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
    expect(exception).toBe(66);
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
        expect(check1.exception).toBe(67);
      });
    }).hence(function (desc) {
        var it1 = desc.specifications[0];
        expect(it1.expectationAttempted).toBe(1);
        expect(it1.expectationSuccessful).toBe(0);
    });
  });

  it("Expectations are weighted (1)", function () {
      yasmini.describe("Yasmini: Expectations are weighted", function () {
          var it1 = yasmini.it("should run it", function () {
              var check1 = yasmini.expect("2").eval().toBe(2);
              expect(check1.weight).toBe(1);
              expect(check1.pass).toBeTruthy();
              var check2 = yasmini.expect("1+1", {
                  weight: 10
              }).eval().toBe(2);
              expect(check2.weight).toBe(10);
              expect(check2.pass).toBeTruthy();
          }, {
              expectationIntended: 11
          });
      }).hence(function (desc) {
          var it1 = desc.specifications[0];
          //console.log(it1);//
          expect(it1.pass).toBeTruthy();
          expect(it1.expectationAttempted).toBe(11);
          expect(it1.expectationSuccessful).toBe(11);
      });
  });
    
    it("Expectations are weighted (2)", function () {
      yasmini.describe("Yasmini: Expectations are weighted", function () {
          var it1 = yasmini.it("should run it", function () {
              var check1 = yasmini.expect("3").eval().toBe(2);
              expect(check1.weight).toBe(1);
              expect(check1.pass).toBeFalsy();
              var check2 = yasmini.expect("1+1", {
                  weight: 5
              }).eval().toBe(2);
              expect(check2.weight).toBe(5);
              expect(check2.pass).toBeTruthy();
          }, {
              expectationIntended: 6
          });
      }).hence(function (desc) {
          var it1 = desc.specifications[0];
          expect(it1.pass).toBeFalsy();
          expect(it1.expectationAttempted).toBe(6);
          expect(it1.expectationSuccessful).toBe(5);
      });
  });

  it("should offer done explicitly called", function (done) {
      var fin = false;
      yasmini.describe("Yasmini: should offer done explicitly called", function () {
          yasmini.it("should run it", function (ydone) {
              function finished () {
                  console.log("finished called");
                  fin = true;
                  ydone();
              }
              fin = true;
              ydone();
          });
      }).hence(function (desc) {
          //console.log(desc.log);
          expect(fin).toBeTruthy();
          done();
      });
  });
          
  it("should offer done deferred called", function (done) {
      var fin = false;
      yasmini.describe("Yasmini: should offer done deferred called", function () {
          yasmini.it("should run it", function (ydone) {
              function finished () {
                  //console.log("finished called");
                  fin = true;
                  ydone();
              }
              setTimeout(finished, 500);
              yasmini.expect(fin).toBeFalsy();
          });
      }).hence(function (desc) {
          //console.log(desc.log);
          expect(fin).toBeTruthy();
          done();
      });
  });
          
  it("should offer done deferred not called soon enough", function (done) {
      var fin = false;
      yasmini.describe("Yasmini: should offer done deferred not called soon enough", function () {
          yasmini.it("should run it", function (ydone) {
              function finished () {
                  console.log("finished called");
                  fin = true;
                  ydone();
              }
              // longer than the timeout for Jasmine:
              setTimeout(finished, 5500); // 5.5 seconds
              yasmini.expect(fin).toBeFalsy();
          }, 1000 ); // 1 second
      }).hence(function (desc) {
          //console.log(desc.log);
          expect(fin).toBeFalsy();
          done();
      });
  });
           
  it("should offer done deferred not called soon enough", function (done) {
      var fin = false;
      yasmini.describe("Yasmini: should offer done deferred not called soon enough", function () {
          yasmini.it("should run it", function (ydone) {
              function finished () {
                  console.log("finished called");
                  fin = true;
                  ydone();
              }
              // shorter than the timeout for Jasmine:
              setTimeout(finished, 2500); // 2.5 seconds
              yasmini.expect(fin).toBeFalsy();
          }, 1000 ); // 1 second
      }).hence(function (desc) {
          //console.log(desc.log);
          expect(fin).toBeFalsy();
          done();
      });
  });

}); // end of describe

// end of test2-spec.js
