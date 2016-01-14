'use strict';

const Joi = require(`joi`);
const load = require(`../utils/file`).load;

// schema to enforce incoming options
const schema = Joi.object().keys({
  path: Joi.string().required(),
  // see https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
  encoding: Joi.string().valid(`utf8`, `ascii`, `utf16le`, `base64`, `binary`, `hex`)
});

/**
 * Loads file content as a string.
 *
 * @param {Object} opt - option to configure loading
 * @param {String} opt.path - absolute or relative path to read file
 * @param {String} opt.encoding = utf8 - encoding used to read the file
 * @return {Promise<String>} fulfilled with an object containing
 * @return {String} content - file's content
 */
module.exports = opt => {
  Joi.assert(opt, schema);
  return load(opt.path, opt.encoding).
    then(content => {
      return {content};
    });
};
