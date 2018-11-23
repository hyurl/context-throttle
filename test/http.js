"use strict";

const createThrottle = require("..").default;
const MemoryStore = require("..").MemoryStore;
const http = require("http");
const assert = require("assert");
const co = require("co");
const Axios = require("axios").default;
const hash = require("object-hash");
const values = require("lodash/values");
const sleep = require("./util").sleep;

describe("throttle for native http application", () => {
    var defaultStorage = new MemoryStore;
    var throttle = createThrottle({
        duration: 1,
        useKey: ["method", "url"],
        gcInterval: 0,
        except: (ctx) => ctx.method == "PATCH",
        storage: defaultStorage
    });
    var server = http.createServer((req, res) => {
        co(function* () {
            if (req.url == "/example") {
                if (yield throttle(req)) {
                    res.end("operation succeed");
                } else {
                    res.end("too many requests");
                }
            } else if (req.url == "/example2") {
                if (yield throttle(req, 2)) {
                    res.end("operation succeed");
                } else {
                    res.end("too many requests");
                }
            }
        });
    });
    var url = "http://localhost:3000/example";

    before(done => server.listen(3000, done));
    after(done => server.close(done));

    it("should perform throttle control as expected", (done) => {
        co(function* () {
            try {
                let res1 = (yield Axios.get(url)).data,
                    res2 = (yield Axios.get(url)).data,
                    res3 = (yield Axios.post(url, {})).data,
                    res4 = (yield sleep(1).then(() => Axios.get(url))).data;

                assert.strictEqual(res1, "operation succeed");
                assert.strictEqual(res2, "too many requests");
                assert.strictEqual(res3, "operation succeed");
                assert.strictEqual(res4, "operation succeed");
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it("should skip throttle test as expected", (done) => {
        co(function* () {
            try {
                let res1 = (yield Axios.patch(url, {})).data,
                    res2 = (yield Axios.patch(url, {})).data;

                assert.strictEqual(res1, "operation succeed");
                assert.strictEqual(res2, "operation succeed");
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it("should contain records in the storage as expected", () => {
        assert.deepStrictEqual(Object.keys(defaultStorage.records), [
            hash({ method: "GET", url: "/example" }),
            hash({ method: "POST", url: "/example" }),
        ]);

        for (let record of values(defaultStorage.records)) {
            assert.notEqual(new Date(record[1]).toString(), "Invalid Date");
            assert.strictEqual(record[1], 1);
        }
    });

    it("should perform throttle control with new duration as expected", function (done) {
        this.timeout(3000);
        co(function* () {
            try {
                let url2 = url + "2",
                    res1 = (yield Axios.get(url2)).data,
                    res2 = (yield Axios.get(url2)).data,
                    res3 = (yield sleep(1).then(() => Axios.get(url2))).data,
                    res4 = (yield sleep(1).then(() => Axios.get(url2))).data;

                assert.strictEqual(res1, "operation succeed");
                assert.strictEqual(res2, "too many requests");
                assert.strictEqual(res3, "too many requests");
                assert.strictEqual(res4, "operation succeed");
                done();
            } catch (err) {
                done(err);
            }
        });
    });
});