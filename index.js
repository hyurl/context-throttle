"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

exports.default = exports.createThrottle = require("./lib/index").default;
exports.CommonStore = require("./lib/storage").default;
exports.createThrottle.express = require("./lib/express");
exports.createThrottle.koa = require("./lib/koa");