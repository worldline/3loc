'use strict';

const Mocha = require('mocha');
const Runner = Mocha.Runner;
const Suite = Mocha.Suite;
const Test = Mocha.Test;

/**
 * Declare test within mocha.
 * @param {Array<Spec>} specs - test specifications to register
 * @param {String} suiteName - optional name used for the test suite
 * @returns {Mocha.Suite} the test suite created
 */
const declareTests = (specs, suiteName) => {

  // declares a single describe for all tests.
  const suite = new Suite(suiteName);
  // and declares all specified tests
  for (let spec of specs) {
    suite.addTest(new Test(spec.name, spec.generateTest()));
  }
  return suite;
};

/**
 * Run all specified tests within Mocha and returns result.
 * @param {Array<Spec>} specs - array of integration test specs
 * @param {Object} opts - options used for runner
 * @param {String} opts.reporter - reporter used
 * @returns {Promise} promise resolves when test are finished.
 */
const run = (specs, opts) => {
  return new Promise(resolve => {
    console.log('prepare mocha execution...');

    const mocha = new Mocha(opts);
    const runner = new Runner(declareTests(specs, 'Integration tests'));
    // instanciate reporter because mocha won't do it by himself
    /* eslint no-unused-vars: 0, no-underscore-dangle: 0 */
    const reporter = new mocha._reporter(runner);

    console.log('running mocha...');
    runner.run(failures => {
      console.log(`execution finished with ${failures} failures !`);
      resolve();
    });
  });
};

module.exports = run;
