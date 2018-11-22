"use strict";

const hash = require("object-hash");
const get = require("lodash/get");
const clone = require("lodash/clone");
const MemoryStore = require("./storage").default;
const gcEnabled = Symbol("gcEnabled");
const defaultStorage = new MemoryStore();

function getHash(context, key) {
    if (typeof key == "string" && context[key]) {
        if (typeof context[key] == "string") {
            return context[key];
        } else if (["number", "boolean", "symbol"].indexOf(typeof context[key]) >= 0) {
            return String(context[key]);
        } else if (context[key] instanceof RegExp) {
            return context[key].toString();
        }
    }

    let ctx = {},
        keys = Array.isArray(key) ? key : [key];

    if (keys.length) {
        keys.forEach(k => {
            ctx[k] = get(context, k);
        });
    } else {
        ctx = clone(context);
    }

    return hash(ctx);
}

function enableGc(options, timer) {
    if (timer === undefined) {
        process.once("beforeExit", () => {
            options.storage[gcEnabled] = false;
            timer && clearTimeout(timer);
        });
    }

    options.storage[gcEnabled] = true;
    timer = setTimeout(() => {
        options.storage.gc(() => enableGc(options, timer));
    }, options.gcInterval * 1000);
}

exports.default = function createThrottle(options) {
    options = Object.assign({
        duration: 5,
        useKey: void 0,
        except: null,
        storage: defaultStorage,
        gcInterval: 15
    }, options);

    // enable gc if hasn't
    options.storage[gcEnabled] || enableGc(options);

    return (context, duration, cb) => {
        if (typeof duration == "function") {
            cb = duration;
            duration = options.duration;
        }


        let id = getHash(context, options.useKey),
            shouldSkip = options.except ? options.except(context) : false,
            promise = new Promise((resolve, reject) => {
                if (shouldSkip)
                    return resolve(true);

                options.storage.test(id, (err, pass) => {
                    if (!err && pass) {
                        // update throttle record
                        options.storage.set(id, duration, (err) => {
                            err ? reject(err) : resolve(true);
                        });
                    } else {
                        err ? reject(err) : resolve(false);
                    }
                });
            });

        if (cb) {
            promise.then(pass => cb(null, pass)).reject(err => cb(err, false));
        } else {
            return promise;
        }
    };
};