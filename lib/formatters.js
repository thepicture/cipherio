"use strict";

const { isPrimitive } = require("./checkers");

const getOptions = (seed, defaultEncoding) => ({
  seed,
  encoding: defaultEncoding,
});

const getNormalizedParams = (params, defaultEncoding) => {
  if (isPrimitive(params)) {
    return getOptions(params, defaultEncoding);
  } else {
    return {
      ...params,
      seed: params.seed || 0,
    };
  }
};

module.exports = {
  getNormalizedParams,
};
