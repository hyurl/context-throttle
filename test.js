"use strict";

const createThrottle = require(".").default;
const http = require("http");
const assert = require("assert");
const co = require("co");
const Axios = require("axios").default;

function sleep(timeout) {
    return new Promise(resolve => setTimeout(() => resolve(), timeout));
}

describe("throttle for native http application", () => {
    var throttle = createThrottle({
        duration: 10,
        useKey: "url"
    });
    var server = http.createServer((req, res) => {
        if (req.url == "/example") {
            co(function* () {
                if (yield throttle(req, 1)) {
                    res.end("operation succeed");
                } else {
                    res.end("too many requests");
                }
            });
        }
    });

    it("should perform throttle control as expected", (done) => {
        server.listen(4000, () => {
            co(function* () {
                try {
                    let url = "http://localhost:4000/example",
                        res1 = (yield Axios.get(url)).data,
                        res2 = (yield Axios.get(url)).data,
                        res3 = (yield sleep(1000).then(() => Axios.get(url))).data;

                    assert.strictEqual(res1, "operation succeed");
                    assert.strictEqual(res2, "too many requests");
                    assert.strictEqual(res3, "operation succeed");
                    done();
                } catch (err) {
                    done(err);
                } finally {
                    server.close(() => {
                        setTimeout(() => process.exit(), 500);
                    });
                }
            });
        });
    });
});