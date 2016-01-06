'use strict';

const parse = require(`../parser/csv`);
const run = require(`../runner/mocha`);
const logger = require(`./logger`)(`cli-run`);

/**
 * Generate tests files from fixtures and run them with mocha
 *
 * @param {String} specs - file containg test specs, @see parser
 * @param {Object} opts - options object to customize runner
 * @param {String} opts.reporter - reporter used by runner
 * @return {Promise<Number>} resolved when test where run with the number of failures
 */
const runTests = (specs, opts) => {
  return parse(specs).
    then(scenarii => run(scenarii, {reporter: opts.reporter})).
    catch(err => {
      logger.error(`failed to run tests:`, err);
      throw err;
    });
};

module.exports = runTests;
