"use strict";

exports.sleep = function sleep(timeout) {
    return new Promise(resolve => setTimeout(() => resolve(), timeout * 1000));
}