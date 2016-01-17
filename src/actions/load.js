'use strict';

const Joi = require(`joi`);
const load = require(`../utils/file`).load;
const basename = require(`path`).basename;
const logger = require(`../utils/logger`)(`act:load`);

/**
 * Loads file content as a string.
 *
 * @param {String} path - absolute or relative path to read file
 * @param {String} encoding = utf8 - encoding used to read the file
 *
 * @return {Function} function that loads the file when invoked.
 * Takes as first parameter an object.
 * Returns a promise fulfilled with the same object, containing
 * - {String} content - response body received (might be parsed in JSON/XML)
 * - {Object} path - absolute or relative path to read file
 */
module.exports = (path, encoding) => {
  Joi.assert(path, Joi.string().required(), `load action`);
  // see https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
  Joi.assert(encoding, Joi.string().valid(`utf8`, `ascii`, `utf16le`, `base64`, `binary`, `hex`), `load action`);

  return args => {
    args._ctx = args._ctx || {stack: []};
    args._ctx.stack.push(`load file ${basename(path)}`);
    logger.debug(`load file ${path}`);
    return load(path, encoding).
      then(content => {
        logger.debug(`load from ${path}:\n${content}`);
        args.content = content;
        args.path = path;
        return args;
      });
  };
};
