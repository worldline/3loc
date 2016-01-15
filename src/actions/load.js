'use strict';

const Joi = require(`joi`);
const load = require(`../utils/file`).load;
const basename = require(`path`).basename;

// schema to enforce incoming options
const schema = Joi.object().keys({
  path: Joi.string().required(),
  // see https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
  encoding: Joi.string().valid(`utf8`, `ascii`, `utf16le`, `base64`, `binary`, `hex`)
}).unknown();

/**
 * Loads file content as a string.
 *
 * @param {Object} opt - option to configure loading
 * @param {String} opt.path - absolute or relative path to read file
 * @param {String} opt.encoding = utf8 - encoding used to read the file
 * @param {Object} opt._ctx = {} - internal context used for reporting
 * @return {Promise<String>} fulfilled with the option object modified with:
 * @return {String} content - file's content
 */
module.exports = opt => {
  Joi.assert(opt, schema);
  opt._ctx = opt._ctx || {stack: []};
  opt._ctx.stack.push(`load file ${basename(opt.path)}`);
  return load(opt.path, opt.encoding).
    then(content => {
      opt.content = content;
      return opt;
    });
};
