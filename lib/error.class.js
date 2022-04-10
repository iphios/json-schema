'use strict';

/**
 * @class
 * @classdesc it is used to identify json-schema error type.
 */
const JSONSchemaValidationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
};

module.exports = {
  JSONSchemaValidationError
};
