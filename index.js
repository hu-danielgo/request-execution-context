"use strict";

const ExecutionContext = require('./ExecutionContext');

let _instance = null;

module.exports = {
  createInstance: function (realClientIpHeader, requestIdHeader) {
    if (!_instance)
      _instance = new ExecutionContext(realClientIpHeader, requestIdHeader);

    return _instance;
  },
  getInstance: function () {
    return _instance;
  },
};
