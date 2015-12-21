'use strict';

const mocha = require('mocha');

/*
 * Declare test within mocha.
 * @param {Array<Spec>} specs - test specifications to register
 * @param {String} suiteName - optional name used for the test suite
 * @return {Mocha.Suite} the test suite created
 */
const declareTests = (specs, suiteName) => {

  // declares a single describe for all tests.
  const suite = new mocha.Suite(null, suiteName);
  // and declares all specified tests
  for (let spec of specs) {
    suite.addTest(new mocha.Test(spec.name, spec.generateTest()));
  }
  return suite;
};

/**
 * Run all specified tests within Mocha and returns result
 * @param {Array<Spec>} specs - test specifications
 * @return {Promise<Object>} promise resolves with JSON report.
 */
const runTests = specs => {
  return new Promise(resolve => {
    const runner = new mocha.Runner(declareTests(specs, 'Integration tests'));
    runner.on('end', resolve).run();
  });
};

module.exports = runTests;
