"use strict";

exports.default = class CommonStore {
    constructor(storage) {
        this.records = storage || {};
    }

    get checker() {
        let now = Date.now();
        return (record) => {
            return Math.floor((now - record[0]) / 1000) >= record[1];
        };
    }

    set(id, duration, cb) {
        this.records[id] = [Date.now(), duration];
        cb(null);
    }

    test(id, cb) {
        if (!this.records[id]) {
            cb(null, true);
        } else {
            cb(null, this.checker(this.records[id]));
        }
    }

    gc(cb) {
        let isExpired = this.checker;

        for (let id in this.records) {
            isExpired(this.records[id]) && (delete this.records[id]);
        }

        cb();
    }
};