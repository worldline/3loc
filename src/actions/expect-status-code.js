'use strict';

const expect = require(`chai`).expect;

/**
 * Print a comprehensive error message from context
 * @param {String} assertion - error prefix, generally contains the assertion kind
 * @param {Object} context - context object
 * @return {String} human-readable message
 */
const printContext = (assertion, context) => {
  const stack = context && context.stack && context.stack.join(`\nthen `);
  return `\n${stack ? `when ${stack}\n` : ``}${assertion}`;
};

/**
 * Checks that a given status code has been received.
 *
 * @param {Number} code - expected value
 * @return {Function} function usable in promises chain
 */
module.exports = code => {
  return opt => {
    expect(opt, printContext(`unexpected status code`, opt._ctx)).to.have.property(`code`).that.equals(code);
    return opt;
  };
};
