"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

exports.default = exports.createThrottle = require("./lib/index").default;
exports.MemoryStore = require("./lib/storage").default;
exports.createThrottle.express = require("./lib/express");
exports.createThrottle.koa = require("./lib/koa");