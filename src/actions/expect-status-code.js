'use strict';

const Joi = require(`joi`);
const expect = require(`chai`).expect;
const printContext = require(`../utils/object`).printContext;
const logger = require(`../utils/logger`)(`expect:status`);

/**
 * Checks that a given status code has been received.
 *
 * @param {Number} code - expected value
 * @return {Function} function usable in promises chain
 * Takes as first parameter an object containing
 * - {Object} code - checked code value
 * Returns a promise fulfilled with the same object
 */
module.exports = code => {
  Joi.assert(code, Joi.number().required(), `statusCode expectation`);
  return args => {
    expect(args, printContext(`unexpected status code`, args._ctx)).to.have.property(`code`).that.equals(code);
    logger.debug(`expected status code ${code} received`);
    return args;
  };
};
