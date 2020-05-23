# request-execution-context Module

This module uses new in Node 14's AsyncLocalStorage to provide an execution context that will propogate through an incoming request chanin (or any set of function calls started at a synchronous entrance point)/

It has primarly been built to be used as an express middleware, with the intention of providing a cross cutting context object, preventing the need to pass an object through multiple layers to log certain data.

It somewhat replicates a Per Request property bag, or Transient/Request scoped object that you might come to expect in other languages with decent DI containers.

## Usage
To use it as an Express middleware, first create the context and construct an instance that will be used for your application. You can provide two header names - a real client IP header and a request ID header - this is useful if your service is downstream in a distributed request path. Otherwise, a request ID will be created when the middleware is invoked
```
const contextObject = require('request-execution-context');
contextObject.createInstance(
  "X-Real-IP",
  "X-Distributed-Request-Id"
);
```
The module exposes an Express compatible middleware - you should put this as early as possible in your middleware chain for best effect.
```
app.use(contextObject.runMiddleware);
```
Now, at any point in your execution chain, you can access the executing context, without any reference to the incoming request object.
```
const contextObject = require('request-execution-context');
let ctx = contextObject.getCurrentContext();
```
The context object will have the following shape
```
{
    requestId: <UUID by default>,
    requestContext: {
        socketIp: req.ip,
        hostname: req.hostname,
        path: req.path,
        forwardedFor: req.header("X-Forwarded-For"),
        userAgent: req.header("User-Agent"),
        realIp: <Real IP if Header Supplied>,
    }
}
```
## Seting An Identity
Typically this can be done in the middleware, but in case it has to be done elsewhere (like, post login), you are able to set an identityContext.
```
const contextObject = require('request-execution-context');
contextObject.setIdentityForContext({userId: result.userId});
```
This adds an `identityContext` property on the object returned in the `getCurrentContext` call. The shape of the object saved is up to the consumer.
## How It Works
It uses the new in Node 14 AsyncLocalStorage feature. While this is marked _experimental_, the underlying `async-hooks` tech has been baked in since Node 8. AsyncLocalStorage just provides a nice abstraction to use what is effectively closure-local-storage