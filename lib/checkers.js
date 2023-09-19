"use strict";

const isPrimitive = (seed) => typeof seed !== "object" && seed !== null;

module.exports = {
  isPrimitive,
};
