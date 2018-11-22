# Context-Throttle

**Context based throttle control.**

## Example

```javascript
const { createServer } = require("http");
const { createThrottle } = require("context-throttle");

var throttle = createThrottle({
    useKey: "url"
});
var server = createServer(async (req, res) => {
    if (req.url == "/example") {
        // Lock the operation so that it can only be performed every 10 seconds.
        // Just an example, don't do this in your production since it locks for
        // every user in this case.
        if (await throttle(req， 10)) {
            res.end("Operation secceed.");
        } else {
            res.end("You've just operated a few seconds ago.");
        }
    }
});
```

This module also provides middleware for Express and Koa.

### Express

```javascript
const { createThrottle } = require("context-throttle");
const express = require("express");
const session = require("express-session");

var app = express();
var throttle = createThrottle.express({
    useKey: "session.id",
    throw: [429, 'Too Many Requests']
});

app.use(session(/* ... */));
app.post("/example", throttle(10), (req, res) => {
    // If throttle test fails, this function will never be called.
});
```

### Koa

```javascript
const { createThrottle } = require("context-throttle");
const Koa = require("koa");
const Router = require('koa-router');
const session = require("koa-session");

var app = new Koa();
var route = new Router();
var throttle = createThrottle.koa({
    useKey: "session.id",
    throw: [429, 'Too Many Requests']
});

app.use(session(/* ... */));

route.post("/example", throttle(10));
route.post("/example", (ctx, next) => {
    // If throttle test fails, this function will never be called.
});

app.use(route);
```

You can use this mechanism in SocketIO as well.

### SocketIO

```javascript
const { createThrottle } = require("context-throttle");
const SocketIO = require("socket.io");

var io = new SocketIO();
var throttle = createThrottle({
    useKey: "id"
});

io.on("connection", socket => {
    socket.on("example", async (msg) => {
        if (await throttle(socket, 10)) {
            socket.emit("example", [200, "Operation secceed."]);
        } else {
            socket.emit("example", [429, 'Too Many Requests']);
        }
    });
});
```

## API

**createThrottle(options?: ThrottleOptions): ThrottleFunction**

*Create a throttle function that can be reused many times.*

A `ThrottleFunction` has three signatures:

- `(context: I, duration?: number): Promise<boolean>`
- `(context: I, cb: (err: Error, pass: boolean) => void): void`
- `(context: I, duration: number, cb: (err: Error, pass: boolean) => void): void`

The `ThrottleOptions` interface contains these optional attributes:

- `duration: number` The default duration in seconds to lock between two 
    operations, the default value is `5`.
- `useKey: string` Uses a property from the context object to populate hash id 
    for storing throttle records.
- `except: (context) => boolean` The throttle rule will not be applied to the 
    matching condition, returns `true` or `false` to indicate skipping or 
    testing.
- `gcInterval: number` Garbage collection interval in seconds, expired throttle 
    records will be deleted after timeout.
- `storage: ThrottleStorage` Uses a customized storage implementation to store 
    throttle records. By default, records are stored in memory.

A `ThrottleStorage` must implement these methods:

- `set(id: string, duration: number, cb: (err: Error) => void): void`
    Sets a throttle record in the storage.
    - `id` A unique hash id populated by throttle function.
    - `duration` The duration in seconds passed to the throttle function.
    - `cb` After the record is stored (or any error occurred), this function 
        will be called. 
- `test(id: string, cb: (err: Error, pass: boolean) => void): void`
    Tests if a throttle is available.
    - `id` A unique hash id populated by throttle function.
    - `cb` After test, this function will be called with potential error and 
        `pass` argument indicates test succeed or failed.
- `gc(cb: () => void): void` Garbage collection implementation. Since the 
    throttle function will not care if there is any error during gc, so not 
    error is passed to the callback function, the gc itself must handle any 
    potential errors.

In `express()` and `koa()` favors, there is an additional property that could be
set in options:

- `throw: [number, string] | ((req, res) => void)`
- `throw: [number, string] | ((ctx) => void)`

If a new request happens when the throttle is locked, throw a message to the
client. If an array is provided, it contains an HTTP status code and a message; 
if a function is provided, you're able to handle and send the response yourself.
The default value is `[429, 'Too Many Requests']`.

For full API, please check [TypeScript Declarations](/index.d.ts).