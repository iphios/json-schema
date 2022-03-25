'use strict';

// require packages
const jsonschema = require('./../index.js');
const debug = require('./../debug.js');

beforeEach(() => {
  debug.jsonschema = jest.fn();
});

describe('custom error class', () => {
  it('custom error message', () => {
    const errorMessage = 'test';
    const errObj = new jsonschema.error(errorMessage);
    expect(errObj.name).toBe('JSONSchemaValidationError');
    expect(errObj.message).toBe(errorMessage);
  });
});

describe('json-schema validation', () => {
  it('checking jsonschema object', () => {
    expect(typeof jsonschema.add).toBe('function');
    expect(typeof jsonschema.has).toBe('function');
    expect(typeof jsonschema.clear).toBe('function');
    expect(typeof jsonschema.validate).toBe('function');
  });

  it('checking add fun', () => {
    const id = 'num';
    jsonschema.add(id, {
      type: 'number'
    });
    expect(debug.jsonschema).toHaveBeenNthCalledWith(1, `schema "${id}" added`);
    const output = jsonschema.has('num');
    expect(output).toBe(true);
  });

  it('checking add fun again', () => {
    const id = 'num';
    jsonschema.add(id, {
      type: 'number'
    });
    expect(debug.jsonschema).toHaveBeenNthCalledWith(1, `schema with "${id}" already exist`);
    jsonschema.clear();
    expect(debug.jsonschema).toHaveBeenNthCalledWith(2, 'all schemas cleared');
    const output = jsonschema.has('num');
    expect(output).toBe(false);
    jsonschema.add(id, {
      type: 'number'
    });
    expect(debug.jsonschema).toHaveBeenNthCalledWith(3, `schema "${id}" added`);
  });

  it('invalid schema validation', () => {
    const id = 'abc';
    jsonschema.validate(id);
    expect(debug.jsonschema).toHaveBeenNthCalledWith(1, `schema with "${id}" not exist`);
  });

  it('validating string number', () => {
    const id = 'num';
    try {
      jsonschema.validate(id, '12');
    } catch (err) {
      expect(err).toBeInstanceOf(jsonschema.error);
      expect(err.message).toBe('[{"key":"$","value":"12","type":"number","message":"Invalid value type"}]');
    }
    expect(debug.jsonschema).toHaveBeenNthCalledWith(1, `schema "${id}" validating`);
    expect(debug.jsonschema).toHaveBeenNthCalledWith(2, `schema "${id}" validated`);
    jsonschema.clear();
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

    try {
      jsonschema.validate('notify', {
        type: 'info',
        array: [1, 2, '3']
      });

    } catch (err) {
      expect(err).toBeInstanceOf(jsonschema.error);
      expect(err.message).toBe('[{"key":"$.array[2]","value":"3","type":"number","message":"Invalid value type"}]');
    } finally {
      jsonschema.clear();
    }
  });

  it('invalid schema type', () => {
    jsonschema.add('invalid_schema_type', {
      type: 'obj'
    });
    expect(jsonschema.validate('invalid_schema_type'));
    expect(debug.jsonschema).toHaveBeenNthCalledWith(3, 'unknown schema type given "obj"');
    jsonschema.clear();
  });

  it('schema ref', () => {
    jsonschema.add('object', {
      type: 'object',
      properties: {
        value: {
          type: 'integer'
        }
      }
    });
    jsonschema.add('array', {
      type: 'array',
      items: {
        $ref: 'object'
      }
    });
    expect(jsonschema.validate('array', [{
      value: 12
    }])).toBe(undefined);
    jsonschema.clear();
  });

  it('invalid schema ref', () => {
    jsonschema.add('object', {
      type: 'object',
      properties: {
        value: {
          type: 'integer'
        }
      }
    });
    jsonschema.add('array', {
      type: 'array',
      items: {
        $ref: 'obj'
      }
    });
    expect(jsonschema.validate('array', [{
      value: 12
    }])).toBe(undefined);
    expect(debug.jsonschema).toHaveBeenNthCalledWith(4, '"obj" schema does not exist');
    jsonschema.clear();
  });
});

describe('missing keys check', () => {
  it('missing properties key check', () => {
    jsonschema.add('object', {
      type: 'object'
    });
    expect(jsonschema.validate('object', {})).toBe(undefined);
    expect(debug.jsonschema).toHaveBeenNthCalledWith(3, 'invalid schema, missing "properties" key');
    jsonschema.clear();
  });

  it('missing items key check', () => {
    jsonschema.add('array', {
      type: 'array'
    });
    expect(jsonschema.validate('array', [])).toBe(undefined);
    expect(debug.jsonschema).toHaveBeenNthCalledWith(3, 'invalid schema, missing "items" key');
    jsonschema.clear();
  });
});

describe('validating all conditions', () => {
  it('validating conditions', () => {
    jsonschema.add('object', {
      type: 'object',
      properties: {
        integer1: {
          type: 'integer',
          values: [1, 2, 3]
        },
        integer2: {
          type: 'integer',
          minimum: 0
        },
        integer3: {
          type: 'integer',
          maximum: 0
        },
        string1: {
          type: 'string',
          values: ['a', 'b']
        },
        string2: {
          type: 'string',
          minLength: 1
        },
        string3: {
          type: 'string',
          maxLength: 0
        },
        string4: {
          type: 'string',
          pattern: /^[0-9]{1,}$/
        },
        boolean1: {
          type: 'boolean'
        },
        object1: {
          type: 'object'
        },
        array1: {
          type: 'array'
        },
        array2: {
          type: 'array'
        }
      },
      required: ['array2']
    });
    try {
      jsonschema.validate('object', {
        integer1: 0,
        integer2: -1,
        integer3: 1,
        string1: 1,
        string2: '',
        string3: 'ab',
        string4: 'ab',
        boolean1: 0,
        object1: 1,
        array1: 1,
        array3: 1
      });

    } catch (err) {
      expect(err).toBeInstanceOf(jsonschema.error);
      expect(err.message).toBe('[{"key":"$","property":"array3","message":"Extra property found"},{"key":"$.integer1","value":0,"values":[1,2,3],"message":"Value does not satisfy allowed values constraint"},{"key":"$.integer2","value":-1,"minimum":0,"message":"Value does not satisfy minimum constraint"},{"key":"$.integer3","value":1,"maximum":0,"message":"Value does not satisfy maximum constraint"},{"key":"$.string1","value":1,"type":"string","message":"Invalid value type"},{"key":"$.string1","value":1,"values":["a","b"],"message":"Value does not satisfy allowed values constraint"},{"key":"$.string2","value":"","minLength":1,"message":"Value does not satisfy minLength constraint"},{"key":"$.string3","value":"ab","maxLength":0,"message":"Value does not satisfy maxLength constraint"},{"key":"$.string4","value":"ab","pattern":{},"message":"Value does not satisfy pattern constraint"},{"key":"$.boolean1","value":0,"type":"boolean","message":"Invalid value type"},{"key":"$.object1","value":1,"type":"object","message":"Invalid value type"},{"key":"$.array1","value":1,"type":"array","message":"Invalid value type"},{"key":"$","property":"array2","message":"Not exist"}]');
    } finally {
      jsonschema.clear();
    }
  });
});
