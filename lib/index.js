"use strict";

const hash = require("object-hash");
const get = require("lodash/get");
const pick = require("lodash/pick");
const MemoryStore = require("./storage").default;
const gcEnabled = Symbol("gcEnabled");
const defaultStorage = exports.defaultStorage = new MemoryStore();

function getHash(context, key) {
    if (typeof key == "string") {
        let value = get(context, key);

        if (typeof value == "string" && value.length <= 40) {
            return value;
        } else if (["number", "boolean", "symbol"].indexOf(typeof value) >= 0) {
            return String(value);
        } else if (value instanceof RegExp) {
            return value.toString();
        }
    } else if (Array.isArray(key)) {
        context = pick(context, key);
    }

    return hash(context);
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
    options.storage[gcEnabled] || (options.gcInterval && enableGc(options));

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
            promise.then(pass => cb(null, pass)).catch(err => cb(err, false));
        } else {
            return promise;
        }
    };
};