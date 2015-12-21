'use strict';

/**
 * Represents an integration test specfication
 * @class
 */
module.exports = class SpecBase {

  /**
   * Builds a specification with a name and data fixture
   * @param {String} name - test's name
   * @param {Object} fixtures - test data fixtures
   */
  constructor(name, fixtures) {
    this.name = name;
    this.fixtures = fixtures;
  }

  /**
   * Generates a test
   * @return {Function} a test function
   */
  generateTest() {
    return () => {
      throw new Error('generateTest() not implemented for SpecBase');
    };
  }
};
