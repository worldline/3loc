'use strict';

const parse = require('./parser/csv');
const run = require('./runner/mocha');

/**
 * Generate tests files from fixtures and run them with mocha
 * @param {Object} opts - options object to customize runner
 * @param {String} opts.reporter - reporter used by runner
 * @return {Promise<Number>} resolved when test where run with the number of failures
 */
const runTests = opts => {
  return parse('./test/fixtures/simple-request.csv').
    then(specs => run(specs, {reporter: opts.reporter})).
    catch(err => console.error('failed to run tests:', err));
};

module.exports = runTests;
