const { AsyncLocalStorage } = require("async_hooks");
const { v4: uuidv4 } = require("uuid");

class ExecutionContext {
  #requestIdHeader = undefined;
  #realClientIpHeader = undefined;
  #localStorage = undefined;

  constructor(realClientIpHeader, requestIdHeader) {
    this.#requestIdHeader = requestIdHeader;
    this.#realClientIpHeader = realClientIpHeader;
    this.#localStorage = new AsyncLocalStorage();
  }
  setRequestId(requestId) {
    if (!this.#localStorage.getStore())
      throw new Error("AsyncLocalStorage not initialised");

    const executionRequestId = requestId || uuidv4();
    this.#localStorage.getStore().set('requestId', executionRequestId);
  }

  setIdentityContext(identityContext) {
    if (!this.#localStorage.getStore())
      throw new Error("AsyncLocalStorage not initialised");

    this.#localStorage.getStore().set('identityContext', identityContext);
  }

  createRequestContext(req, res, next) {
    let contextObject = new Map();
    this.#localStorage.enterWith(contextObject);

    if (this.#requestIdHeader)
      this.setRequestId(req.header(this.#requestIdHeader));
    else this.setRequestId(uuidv4());

    this.#localStorage.getStore().set('requestContext', {
      socketIp: req.ip,
      hostname: req.hostname,
      path: req.path,
      forwardedFor: req.header("X-Forwarded-For"),
      userAgent: req.header("User-Agent"),
      traceparent: req.header("traceparent"),
      tracestate: req.header("tracestate"),
      ...(this.#realClientIpHeader &&
        req.header(this.#realClientIpHeader) && {
          realIp: req.header(this.#realClientIpHeader),
        }),
    });

    if (req.user) {
      this.setIdentityContext(req.user);
    }

    next();
  }

  getCurrentContext() {
    return this.#localStorage?.getStore();
  }
}

module.exports = ExecutionContext;
