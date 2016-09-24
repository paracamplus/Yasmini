// Yasmini asynchronous test

function hellohttpserverfn(port){
    var http = require('http');
    var server = http.createServer(function(req, res) {
        res.end("Hello world");  
    });
    server.listen(port);
    return server; 
}

var request = require("request");
var port = 1234;
var host = "localhost";
var base_url = "http://"+host+":"+port+"/";

var server = hellohttpserverfn(port);

var yasmini = require('yasmini');
//yasmini.load('yasmini-verbalize.js');
require('yasmini/example/verbalizer');
var describe = yasmini.describe,
    it       = yasmini.it,
    expect   = yasmini.expect,
    fail     = yasmini.fail;

describe("hellohttpserverfn", function () {
    
    it("returns status code 200", function(done) {
        request.get(base_url, function(error, response, body) {
            expect(response.statusCode).toBe(200);
            done();
        });
    });

    it("returns Hello world", function(done) {
        request.get(base_url, function(error, response, body) {
            expect(body).toBe("Hello world");
            done();
        });
    });
}).hence(function (description) {
    console.log(description.log);
    server.close();
    if ( ! description.pass ) {
        process.exitCode = 1;
    }
});
