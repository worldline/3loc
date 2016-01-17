'use strict';

const Joi = require(`joi`);
const basename = require(`path`).basename;
const compile = require(`../utils/file`).compile;
const utils = require(`../utils/object`);

/**
 * Renders Nunjucks template with given data.
 * If content is given as a promise, the expected fulfilled value must include
 * a `content` property.
 *
 * @param {String|Promise} content - template content
 * @return {Function} function usable in promises chain.
 * Takes as first parameter an object containing
 * - {Object} data - data used to fill template
 * - {String} [path] - optional path or rendered content, used in stack
 * Returns a promise fulfilled with the same object, containing
 * - {String} content - the rendered template
 */
module.exports = content => {
  Joi.assert(content, Joi.alternatives().try(
    Joi.object({then: Joi.func().required()}).unknown(),
    Joi.string()
  ).required(), `render action`);

  return utils.makePromisable(args => {
    args._ctx = args._ctx || {stack: []};
    args._ctx.stack.push(`render template${args.path ? ` ${basename(args.path)}` : ``}`);
    return (utils.getType(content) === 'string' ? Promise.resolve({content}) : content).
      then(result => compile(result.content, args.data || {})).
      then(result => {
        args.content = result;
        return args;
      });
  });
};
