'use strict';

const debug = require('./debug.js');
const {
  JSONSchemaValidationError
} = require('./error.class.js');

let schemas = {};
const is = {
    number: function(val) {
      return Object.hasOwn(Number, 'isFinite') ? Number.isFinite(val) : typeof val === 'number';
    },
    integer: function(val) {
      return this.number(val) && (Object.hasOwn(Number, 'isInteger') ? Number.isInteger(val) : val % 1 === 0);
    },
    string: function(val) {
      return typeof val === 'string';
    },
    boolean: function(val) {
      return typeof val === 'boolean';
    },
    object: function(val) {
      return typeof val === 'object' && val instanceof Object;
    },
    array: function(val) {
      return val instanceof Array && Array.isArray(val);
    }
  },
  _validator = function(schema, data, key = '$', errs = []) {
    if (Object.hasOwn(schema, '$ref')) {
      if (!Object.hasOwn(schemas, schema.$ref)) {
        errs.push({
          message: `"${schema.$ref}" schema does not exist`
        });
        return errs;
      }
      schema = schemas[schema.$ref];
    }

    switch (schema.type) {
      case 'number':
      case 'integer':
        if (!is[schema.type](data)) {
          errs.push({
            key,
            value: data,
            type: schema.type,
            message: 'Invalid value type'
          });
        }

        if (Object.hasOwn(schema, 'values') && !schema.values.includes(data)) {
          errs.push({
            key,
            value: data,
            values: schema.values,
            message: 'Value does not satisfy allowed values constraint'
          });
        }

        // minimum inclusive
        if (Object.hasOwn(schema, 'minimum') && schema.minimum > data) {
          errs.push({
            key,
            value: data,
            minimum: schema.minimum,
            message: 'Value does not satisfy minimum constraint'
          });
        }

        // maximum inclusive
        if (Object.hasOwn(schema, 'maximum') && schema.maximum < data) {
          errs.push({
            key,
            value: data,
            maximum: schema.maximum,
            message: 'Value does not satisfy maximum constraint'
          });
        }

        break;
      case 'string':
        if (!is.string(data)) {
          errs.push({
            key,
            value: data,
            type: schema.type,
            message: 'Invalid value type'
          });
        }

        if (Object.hasOwn(schema, 'values') && !schema.values.includes(data)) {
          errs.push({
            key,
            value: data,
            values: schema.values,
            message: 'Value does not satisfy allowed values constraint'
          });
        }

        // minLength inclusive
        if (Object.hasOwn(schema, 'minLength') && schema.minLength > data.length) {
          errs.push({
            key,
            value: data,
            minLength: schema.minLength,
            message: 'Value does not satisfy minLength constraint'
          });
        }

        // maxLength inclusive
        if (Object.hasOwn(schema, 'maxLength') && schema.maxLength < data.length) {
          errs.push({
            key,
            value: data,
            maxLength: schema.maxLength,
            message: 'Value does not satisfy maxLength constraint'
          });
        }

        if (Object.hasOwn(schema, 'pattern') && !new RegExp(schema.pattern).test(data)) {
          errs.push({
            key,
            value: data,
            pattern: schema.pattern,
            message: 'Value does not satisfy pattern constraint'
          });
        }
        break;
      case 'boolean':
        if (!is.boolean(data)) {
          errs.push({
            key,
            value: data,
            type: schema.type,
            message: 'Invalid value type'
          });
        }
        break;
      case 'object':
        if (!(is.object(data) && !is.array(data))) {
          errs.push({
            key,
            value: data,
            type: schema.type,
            message: 'Invalid value type'
          });
        }

        if (!Object.hasOwn(schema, 'properties')) {
          errs.push({
            message: 'invalid schema, missing "properties" key'
          });
          break;
        }

        // for-in is faster than Object.keys, Object.values, Object.entries
        for (const property in data) {
          if (!Object.hasOwn(schema.properties, property)) {
            errs.push({
              key,
              property,
              message: 'Extra property found'
            });
          }
        }

        // loop each schema property
        for (const property in schema.properties) {

          // if schema property not exist in data
          if (!Object.hasOwn(data, property)) {
            if (Object.hasOwn(schema, 'required') && schema.required.includes(property)) {
              errs.push({
                key,
                property,
                message: 'Not exist'
              });
            }
            continue;
          }

          const subErrs = _validator(schema.properties[property], data[property], `${key}.${property}`);
          if (subErrs !== undefined && subErrs.length) {
            errs = Array.prototype.concat.call(errs, subErrs);
          }
        }
        break;
      case 'array':
        if (!(is.object(data) && is.array(data))) {
          errs.push({
            key,
            value: data,
            type: schema.type,
            message: 'Invalid value type'
          });
        }

        if (!Object.hasOwn(schema, 'items')) {
          errs.push({
            message: 'invalid schema, missing "items" key'
          });
          break;
        }

        for (let i = 0; i < data.length; i++) {
          const subErrs = _validator(schema.items, data[i], `${key}[${i}]`);
          if (subErrs !== undefined && subErrs.length) {
            errs = Array.prototype.concat.call(errs, subErrs);
          }
        }
        break;
      default:
        errs.push({
          message: `unknown schema type given "${schema.type}"`
        });
    }

    return errs;
  },
  add = function(id, schema) {
    if (Object.hasOwn(schemas, id)) {
      debug.jsonschema(`schema with "${id}" already exist`);
      return;
    }

    schemas[id] = schema;
    debug.jsonschema(`schema "${id}" added`);
  },
  has = function(id) {
    return Object.hasOwn(schemas, id);
  },
  clear = function() {
    debug.jsonschema('all schemas cleared');
    schemas = {};
  },
  validate = function(id, data) {
    if (!Object.hasOwn(schemas, id)) {
      debug.jsonschema(`schema with "${id}" not exist`);
      return;
    }

    debug.jsonschema(`schema "${id}" validating`);
    const errs = _validator(schemas[id], data);
    debug.jsonschema(`schema "${id}" validated`);
    if (errs.length) {
      throw new JSONSchemaValidationError(JSON.stringify(errs));
    }
  };

module.exports = {
  error: JSONSchemaValidationError,
  add,
  has,
  clear,
  validate
};
