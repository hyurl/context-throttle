"use strict";

const createThrottle = require("..").default;
const assert = require("assert");
const co = require("co");
const sleep = require("./util").sleep;

describe("throttle for standard JavaScript types", () => {
    it("should perform throttle control on object as expected", function (done) {
        this.timeout(3100);
        co(function* () {
            var throttle = createThrottle({
                gcInterval: 0
            });
            var context = {
                id: Math.random().toString(16).slice(2),
            };
            var logs = [];

            try {
                for (let i = 1; i <= 4; i++) {
                    if (yield throttle(context, 1)) {
                        logs.push("operation succeed");
                    } else {
                        logs.push("too many operations");
                        i < 4 && (yield sleep(1));
                    }
                }

                assert.deepStrictEqual(logs, [
                    "operation succeed",
                    "too many operations",
                    "operation succeed",
                    "too many operations"
                ]);

                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it("should perform throttle control on object and use specified key", function (done) {
        this.timeout(3100);
        co(function* () {
            var throttle = createThrottle({
                useKey: "id",
                gcInterval: 0
            });
            var context = {
                id: Math.random().toString(16).slice(2),
            };
            var logs = [];

            try {
                for (let i = 1; i <= 4; i++) {
                    if (yield throttle(context, 1)) {
                        logs.push("operation succeed");
                    } else {
                        logs.push("too many operations");
                        i < 4 && (yield sleep(1));
                    }
                }

                assert.deepStrictEqual(logs, [
                    "operation succeed",
                    "too many operations",
                    "operation succeed",
                    "too many operations"
                ]);

                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it("should perform throttle control on string as expected", function (done) {
        this.timeout(3100);
        co(function* () {
            var throttle = createThrottle({
                gcInterval: 0
            });
            var logs = [];

            try {
                for (let i = 1; i <= 4; i++) {
                    if (yield throttle("lock", 1)) {
                        logs.push("operation succeed");
                    } else {
                        logs.push("too many operations");
                        i < 4 && (yield sleep(1));
                    }
                }

                assert.deepStrictEqual(logs, [
                    "operation succeed",
                    "too many operations",
                    "operation succeed",
                    "too many operations"
                ]);

                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it("should perform throttle control on number as expected", function (done) {
        this.timeout(3100);
        co(function* () {
            var throttle = createThrottle({
                gcInterval: 0
            });
            var logs = [];

            try {
                for (let i = 1; i <= 4; i++) {
                    if (yield throttle(1000, 1)) {
                        logs.push("operation succeed");
                    } else {
                        logs.push("too many operations");
                        i < 4 && (yield sleep(1));
                    }
                }

                assert.deepStrictEqual(logs, [
                    "operation succeed",
                    "too many operations",
                    "operation succeed",
                    "too many operations"
                ]);

                done();
            } catch (err) {
                done(err);
            }
        });
    });
});