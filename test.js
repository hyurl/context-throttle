const koa = require("koa");
const hash = require("object-hash");

var app = new koa();

app.use((ctx, next) => {
    console.log(hash(ctx));
    ctx.body = "Hello, world!";
    next();
}).use((ctx, next) => {
    ctx.body = "Hi";
});

app.listen(8000);