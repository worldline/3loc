'use strict';

/*
 * @class
 * Represent an integration test specfication
 */
module.exports = class SpecBase {

  /**
   * Builds a specification with a name and data fixture
   * @param {String} name - test's name
   * @param {Object} fixtures - test data fixtures
   */
  constructor(name, fixtures) {
    this.fixtures = fixtures;
  }

  /**
   * Generates a test
   */
  generateTest() {
    return () => {
      throw new Error(`${generateTest()} not implemented for ${SpecBase.constructor.name}`);
    };
  }
};
