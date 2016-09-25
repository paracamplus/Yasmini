// Yasmini asynchronous test

function hellohttpserverfn(port){
    let http = require('http');
    let server = http.createServer(function(req, res) {
        res.end("Hello world");  
    });
    server.listen(port);
    return server; 
}

let request = require("request");
let port = 1234;
let host = "localhost";
let base_url = "http://"+host+":"+port+"/";

let server = hellohttpserverfn(port);

let yasmini = require('yasmini');
//yasmini.load('yasmini-verbalize.js');
require('yasmini/example/verbalizer');
let describe = yasmini.describe,
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
