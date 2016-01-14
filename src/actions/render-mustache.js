'use strict';

const Joi = require(`joi`);
const compile = require(`../utils/file`).compile;

// schema to enforce incoming options
const schema = Joi.object().keys({
  content: Joi.string().required(),
  data: Joi.object()
});

/**
 * Renders Mustache template with given data.
 *
 * @param {Object} opt - option to configure rendering
 * @param {String} opt.content - template content
 * @param {Object} opt.data = {} - data used to fill template
 * @return {Promise<String>} fulfilled with an object containing
 * @return {String} content - rendered content
 */
module.exports = opt => {
  Joi.assert(opt, schema);
  return compile(opt.content, opt.data || {}).
    then(content => {
      return {content};
    });
};
