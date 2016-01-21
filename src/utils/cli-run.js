'use strict';

const extname = require(`path`).extname;
const run = require(`../runner/mocha`);
const logger = require(`./logger`)(`cli-run`);

/**
 * Loads the relevant parser depending on file extension.
 * Currently, csv, yaml and yml extension are recognized
 *
 * @param {String} file - file containing specifications
 * @return {Promise<Function>} fullfilled with the parsing function to use
 */
const loadParser = file =>
  new Promise(resolve => {
    switch (extname(file)) {
    case `.csv`: return resolve(require(`../parser/csv`));
    case `.yaml`:
    case `.yml`: return resolve(require(`../parser/yaml`));
    default: throw new Error(`Unsupported spec file format`);
    }
  });

/**
 * Generate tests files from fixtures and run them with mocha
 *
 * @param {String} specs - file containg test specs, @see parser
 * @param {Object} opts - options object to customize runner
 * @param {String} opts.reporter - reporter used by runner
 * @return {Promise<Number>} resolved when test where run with the number of failures
 */
module.exports = (specs, opts) => {
  return loadParser(specs).
    then(parse => parse(specs)).
    then(tests => run(tests, {reporter: opts.reporter})).
    catch(err => {
      logger.error(`failed to run tests:`, err);
      throw err;
    });
};
