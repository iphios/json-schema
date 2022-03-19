'use strict';

// require packages
const jsonschema = require('./../index.js');
const debug = require('./../debug.js');
const {
  JSONSchemaValidationError
} = require('./../custom.class.js');

beforeEach(() => {
  debug.jsonschema = jest.fn();
});

describe('custom error class', () => {
  it('custom error message', () => {
    const errorMessage = 'test';
    const errObj = new JSONSchemaValidationError(errorMessage);
    expect(errObj.name).toBe('JSONSchemaValidationError');
    expect(errObj.message).toBe(errorMessage);
  });
});

describe('json-schema validation', () => {
  it('checking add', () => {
    jsonschema.add('num', {
      type: 'number'
    });
    const output = jsonschema.has('num');
    expect(output).toBe(true);
    expect(debug.jsonschema).toHaveBeenCalledTimes(1);
  });

  it('checking add again', () => {
    jsonschema.add('num', {
      type: 'number'
    });
    expect(debug.jsonschema).toHaveBeenCalledTimes(1);
  });

  it('invalid schema validation', () => {
    jsonschema.validate('abc');
    expect(debug.jsonschema).toHaveBeenCalledTimes(1);
  });

  it('validating number', () => {
    expect(() => {
      jsonschema.validate('num', '12');
    }).toThrow(JSONSchemaValidationError);
    expect(debug.jsonschema).toHaveBeenCalledTimes(2);
  });

  it('validating object', () => {
    jsonschema.add('notify', {
      type: 'object',
      properties: {
        icon: {
          type: 'string'
        },
        title: {
          type: 'string'
        },
        message: {
          type: 'string'
        },
        type: {
          type: 'string',
          values: ['info', 'success', 'warning', 'danger', 'primary']
        },
        delay: {
          type: 'integer',
          minimum: 0,
          maximum: 1e4
        },
        position: {
          type: 'string',
          values: ['top', 'bottom']
        },
        array: {
          type: 'array',
          items: {
            type: 'number'
          }
        },
        align: {
          type: 'string',
          values: ['left', 'center', 'right']
        },
        dismiss: {
          type: 'boolean'
        }
      },
      required: ['type']
    });
    expect(jsonschema.validate('notify', {
      title: 'abc',
      delay: 1,
      type: 'info',
      dismiss: true,
      array: [1, 2, 3]
    })).toBe(undefined);

    expect(() => {
      jsonschema.validate('notify', {
        type: 'info',
        array: [1, 2, '3']
      });
    }).toThrow(JSONSchemaValidationError);
  });

  it('invalid schema type', () => {
    jsonschema.add('invalid_schema_type', {
      type: 'obj'
    });
    expect(jsonschema.validate('invalid_schema_type'));
    expect(debug.jsonschema).toHaveBeenCalledTimes(4);
  });
});
