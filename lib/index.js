"use strict";

const hash = require("object-hash");
const get = require("lodash/get");
const MemoryStore = require("./storage").MemoryStore;

function getHash(context) {
    if (typeof context == "string") {
        return context;
    } else if (["number", "boolean", "symbol"].indexOf(typeof context) >= 0) {
        return String(context);
    } else if (context instanceof RegExp) {
        return context.toString();
    } else {
        return hash(context);
    }
}

function enableGc(options, timer) {
    if (timer === undefined) {
        process.once("beforeExit", () => {
            timer && clearTimeout(timer);
        });
    }

    timer = setTimeout(() => {
        options.storage.gc(() => enableGc(options, timer));
    }, options.gcInterval * 1000);
}

exports.default = function createThrottle(options) {
    options = Object.assign({
        duration: 5,
        useKey: void 0,
        except: null,
        storage: new MemoryStore(),
        gcInterval: 15
    }, options);

    enableGc(options);

    return (context, duration, cb) => {
        if (typeof duration == "function") {
            cb = duration;
            duration = options.duration;
        }


        let id = getHash(options.useKey && get(context, options.useKey) || context),
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