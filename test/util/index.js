"use strict";

exports.sleep = function sleep(timeout) {
    return new Promise(resolve => setTimeout(() => resolve(), timeout * 1000));
};

exports.cookies = function cookies(headers) {
    return headers.map(header => {
        return header.slice(0, header.indexOf(";"));
    }).join(";");
};