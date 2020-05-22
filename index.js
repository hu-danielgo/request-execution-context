"use strict";

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
    Object.assign(this.#localStorage.getStore(), {
      requestId: executionRequestId,
    });
  }

  setIdentityContext(identityContext) {
    if (!this.#localStorage.getStore())
      throw new Error("AsyncLocalStorage not initialised");

    Object.assign(this.#localStorage.getStore(), {
      identityContext: identityContext,
    });
  }

  createRequestContext(req) {
    let contextObject = Object.create({});
    this.#localStorage.enterWith(contextObject);

    if (req && typeof req.header === "function") {
      this.setRequestId(req.header(this.#requestIdHeader));
      Object.assign(this.#localStorage.getStore(), {
        requestContext: {
          socketIp: req.ip,
          hostname: req.hostname,
          path: req.path,
          forwardedFor: req.header("X-Forwarded-For"),
          userAgent: req.header("User-Agent"),
          ...(this.#realClientIpHeader &&
            req.header(this.#realClientIpHeader) && {
              realIp: this.#realClientIpHeader,
            }),
        },
      });
    } else {
      this.setRequestId(uuidv4());
    }
  }

  getCurrentContext() {
    return this.#localStorage.getStore();
  }
}

module.exports = ExecutionContext;
