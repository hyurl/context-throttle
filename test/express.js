"use strict";

const createThrottle = require("..").default;
const http = require("http");
const assert = require("assert");
const co = require("co");
const Axios = require("axios").default;
const sleep = require("./util").sleep;
const cookies = require("./util").cookies;
const express = require("express");
const session = require("express-session");

describe("throttle for express application", () => {
    var throttle = createThrottle.express({
        useKey: ["session.id", "method", "originalUrl"],
        gcInterval: 0,
        except: (req) => req.headers["x-test-throttle"] === "true"
    });
    var throttle2 = createThrottle.express({
        useKey: ["session.id", "method", "originalUrl"],
        gcInterval: 0,
        throw: [200, "too many request"],
    });
    var throttle3 = createThrottle.express({
        useKey: ["session.id", "method", "originalUrl"],
        gcInterval: 0,
        throw: (req, res) => {
            res.send("too many request");
        },
    });
    var app = express();
    var server = http.createServer(app);
    var url = "http://localhost:3000/example";
    var config;

    app.use(session({ secret: "test", resave: true, saveUninitialized: true }));
    app.get("/example", throttle(1), (req, res) => {
        res.send("operation succeed");
    });
    app.post("/example", (req, res) => {
        res.send("operation succeed");
    });
    app.get("/example2", throttle2(1), (req, res) => {
        res.send("operation succeed");
    });
    app.get("/example3", throttle3(1), (req, res) => {
        res.send("operation succeed");
    });

    before(done => server.listen(3000, done));
    after(done => server.close(done));

    it("should perform throttle control as expected", (done) => {
        co(function* () {
            try {
                let res = yield Axios.get(url),
                    cookie = cookies(res.headers["set-cookie"]);

                config = { headers: { cookie } };

                assert.strictEqual(res.data, "operation succeed");

                try {
                    yield Axios.get(url, config);
                } catch (err) {
                    let res = err["response"];
                    assert.strictEqual(res.status, 429);
                    assert.strictEqual(res.statusText, "Too Many Requests");
                    assert.strictEqual(res.data, "429 Too Many Requests");
                }

                try {
                    yield Axios.post(url, {}, config);
                } catch (err) {
                    let res = err["response"];
                    assert.strictEqual(res.data, "operation succeed");
                }

                try {
                    yield sleep(1).then(() => Axios.get(url, config));
                } catch (err) {
                    let res = err["response"];
                    assert.strictEqual(res.data, "operation succeed");
                }

                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it("should skip throttle test as expected", (done) => {
        co(function* () {
            try {
                config.headers["x-test-throttle"] = "true";

                let res1 = (yield Axios.get(url, config)).data,
                    res2 = (yield Axios.get(url)).data;

                assert.strictEqual(res1, "operation succeed");
                assert.strictEqual(res2, "operation succeed");
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it("should throw customized message as expected", (done) => {
        co(function* () {
            try {
                let url = "http://localhost:3000/example2",
                    res1 = (yield Axios.get(url, config)).data,
                    res2 = (yield Axios.get(url, config)).data;

                assert.strictEqual(res1, "operation succeed");
                assert.strictEqual(res2, "200 too many request");
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it("should handle and send error message as expected", (done) => {
        co(function* () {
            try {
                let url = "http://localhost:3000/example3",
                    res1 = (yield Axios.get(url, config)).data,
                    res2 = (yield Axios.get(url, config)).data;

                assert.strictEqual(res1, "operation succeed");
                assert.strictEqual(res2, "too many request");
                done();
            } catch (err) {
                done(err);
            }
        });
    });
});