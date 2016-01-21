'use strict';

const Joi = require(`joi`);
const expect = require(`chai`).expect;
const utils = require(`../utils/object`);
const logger = require(`../utils/logger`)(`expect:content`);

/**
 * Checks that received content includes the given element,
 * or matches the given pattern.
 *
 * @example
 * run(load('my-file.txt')).
 * then(expectcontentToInclude('Hi !'))
 *
 * @param {String|Regex} element - expected element or matching pattern
 * @return {Function} function usable in promises chain
 * Takes as first parameter an object containing
 * - {Object} content - checked content
 * Returns a promise fulfilled with the same object
 */
module.exports = element => {
  Joi.assert(element, Joi.alternatives().try(Joi.string(), Joi.object().type(RegExp)).required(), `content expectation`);
  const operation = utils.getType(element) === `string` ? `includes` : `matches`;
  return args => {
    console.log('got arg', args);
    expect(args, utils.printContext(`unexpected content`, args._ctx)).to.have.property(`content`).that[operation](element);
    logger.debug(`content ${operation} ${element}`);
    return args;
  };
};
