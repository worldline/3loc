'use strict';

const Joi = require(`joi`);
const basename = require(`path`).basename;
const compile = require(`../utils/file`).compile;

// schema to enforce incoming options
const schema = Joi.object().keys({
  content: Joi.string().required(),
  data: Joi.object()
}).unknown();

/**
 * Renders Mustache template with given data.
 *
 * @param {Object} opt - option to configure rendering
 * @param {String} opt.content - template content
 * @param {Object} opt.data = {} - data used to fill template
 * @param {Object} opt._ctx = {} - internal context used for reporting
 * @return {Promise<String>} fulfilled with the option object modified with:
 * @return {String} content - file's content
 */
module.exports = opt => {
  Joi.assert(opt, schema);
  opt._ctx = opt._ctx || {stack: []};
  opt._ctx.stack.push(`render template${opt.path ? ` ${basename(opt.path)}` : ``}`);
  return compile(opt.content, opt.data || {}).
    then(content => {
      opt.content = content;
      return opt;
    });
};
