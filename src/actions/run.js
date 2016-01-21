'use strict';

const Joi = require(`joi`);
const logger = require(`../utils/logger`)(`act:run`);

/**
 * Runs synchronously a given function, with provided data, and wrap to
 * Promise for next actions and expectations.
 * A must-have when starting a new scenario.
 *
 * @example
 * run(request({url: 'http://somewhere.com/'}))
 *
 * @param {Function} fn - function executed
 * @param {Object} [data] - optionnal data given as function argument
 *
 * @return {Promise} fulfilled with the function result
 */
module.exports = (fn, data) => {
  Joi.assert(fn, Joi.func().required(), `run action`);
  Joi.assert(data, Joi.object(), `run action`);
  return Promise.resolve().then(() => {
    logger.debug(`run action`);
    return fn(data || {});
  });
};
