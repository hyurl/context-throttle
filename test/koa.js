"use strict";

const createThrottle = require("..").default;
const http = require("http");
const assert = require("assert");
const co = require("co");
const Axios = require("axios").default;
const sleep = require("./util").sleep;
const cookies = require("./util").cookies;

describe("throttle for koa application", () => {
    if (parseInt(process.version.slice(1)) < 8) return;

    const koa = require("koa");
    const session = require("koa-session");
    const Router = require("koa-router");

    var throttle = createThrottle.koa({
        useKey: ["session.id", "method", "originalUrl"],
        gcInterval: 0,
        except: (ctx) => ctx.headers["x-test-throttle"] === "true"
    });
    var throttle2 = createThrottle.koa({
        useKey: ["session.id", "method", "originalUrl"],
        gcInterval: 0,
        throw: [200, "too many request"],
    });
    var throttle3 = createThrottle.koa({
        useKey: ["session.id", "method", "originalUrl"],
        gcInterval: 0,
        throw: (ctx) => {
            ctx.body = "too many request";
        },
    });
    var app = new koa();
    var server = http.createServer(app.callback());
    var router = new Router();
    var url = "http://localhost:3000/example";
    var config;

    app.keys = ["test"];
    app.use(session(app)).use((ctx, next) => {
        ctx.session.id = ctx.session.id || Math.random().toString(16).slice(2);
        next();
    });
    router.get("/example", throttle(1), (ctx) => {
        ctx.body = "operation succeed";
    });
    router.post("/example", (ctx) => {
        ctx.body = "operation succeed";
    });
    router.get("/example2", throttle2(1), (ctx) => {
        ctx.body = "operation succeed";
    });
    router.get("/example3", throttle3(1), (ctx) => {
        ctx.body = "operation succeed";
    });
    app.use(router.routes());

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