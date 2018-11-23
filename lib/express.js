"use strict";

const STATUS_CODES = require("http").STATUS_CODES;
const createThrottle = require("./index").default;

module.exports = (options) => {
    options = Object.assign({
        useKey: ["method", "originalUrl"],
        throw: [429, STATUS_CODES[429]]
    }, options);

    let throttle = createThrottle(options);

    return (duration) => {
        return (req, res, next) => {
            return throttle(req, duration, (err, pass) => {
                if (pass) {
                    next();
                } else {
                    if (Array.isArray(options.throw)) {
                        if (parseInt(req.httpVersion) === 2) {
                            res.writeHead(options.throw[0]); // HTTP2
                        } else {
                            res.writeHead(options.throw[0], options.throw[1]);
                        }

                        res.end(options.throw.join(" "));
                    } else {
                        options.throw(req, res);
                    }
                }
            });
        };
    };
};