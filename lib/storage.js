"use strict";

exports.default = class MemoryStore {
    constructor() {
        this.throttles = {};
    }

    get checker() {
        let now = Date.now();
        return (record) => {
            return Math.floor((now - record[0]) / 1000) >= record[1];
        };
    }

    set(id, duration, cb) {
        this.throttles[id] = [Date.now(), duration];
        cb(null);
    }

    test(id, cb) {
        if (!this.throttles[id]) {
            cb(null, true);
        } else {
            cb(null, this.checker(this.throttles[id]));
        }
    }

    gc(cb) {
        let isExpired = this.checker;

        for (let id in this.throttles) {
            isExpired(this.throttles[id]) && (delete this.throttles[id]);
        }

        cb();
    }
};