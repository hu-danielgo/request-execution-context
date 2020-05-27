"use strict";

const ExecutionContext = require("./ExecutionContext");

let _instance = null;

module.exports.createInstance = (realClientIpHeader, requestIdHeader) => {
  if (!_instance)
    _instance = new ExecutionContext(realClientIpHeader, requestIdHeader);
};

module.exports.runMiddleware = (req, res, next) => {
  if (!_instance)
    throw new Error(
      "Execution Context Not Initialised - Run CreateInstance() First"
    );

  _instance.createRequestContext(req, res, next);
};

module.exports.getCurrentContext = () => {
  return _instance?.getCurrentContext();
};

module.exports.setIdentityForContext = (identity) => {
  if (!_instance)
    throw new Error(
      "Execution Context Not Initialised - Run CreateInstance() First"
    );
  _instance.setIdentityContext(identity);
};
