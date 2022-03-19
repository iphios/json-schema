'use strict';

const debugPkg = require('debug');

const MODULE_NAMES = ['jsonschema'];

const debug = {};
MODULE_NAMES.forEach(module => debug[module] = debugPkg(module));

module.exports = debug;
