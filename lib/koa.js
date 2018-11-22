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
        return (ctx, next) => {
            return throttle(ctx, duration).then(pass => {
                if (pass) {
                    next();
                } else {
                    if (Array.isArray(options.throw)) {
                        if (parseInt(ctx.req.httpVersion) === 2) {
                            ctx.throw(options.throw[0]); // HTTP2
                        } else {
                            ctx.throw(options.throw[0], options.throw[1]);
                        }

                        ctx.body = options.throw.join(" ");
                    } else {
                        options.throw(ctx);
                    }
                }
            });
        };
    };
};