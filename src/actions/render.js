'use strict';

const Joi = require(`joi`);
const basename = require(`path`).basename;
const compile = require(`../utils/file`).compile;
const utils = require(`../utils/object`);
const logger = require(`../utils/logger`)(`act:render`);

/**
 * Renders Nunjucks template with given data.
 * If content is given as a function, it must return a promise fulfilled
 * with an object including a `content` and `path` properties.
 *
 * @param {String|Function} content - template rendered
 * @param {Object} [data] - data used for rendering
 * @return {Function} function usable in promises chain.
 * Takes as first parameter an object
 * Returns a promise fulfilled with the same object, containing
 * - {String} content - the rendered template
 */
module.exports = (content, data) => {
  Joi.assert(content, Joi.alternatives().try(Joi.func(), Joi.string()).required(), `render action`);
  Joi.assert(data, Joi.object(), `render action`);
  return args => {
    return (utils.getType(content) === 'function' ?
        Promise.resolve({}).then(content) : Promise.resolve({content})).
      then(result => {
        const message = `render template${result.path ? ` ${basename(result.path)}` : ``}`;
        args._ctx = args._ctx || {stack: []};
        args._ctx.stack.push(message);
        logger.debug(message);
        return compile(result.content, data || {});
      }).
      then(result => {
        logger.debug(`template rendered:\n${result}`);
        args.content = result;
        return args;
      });
  };
};
