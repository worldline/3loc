'use strict';

/**
 * Represents an integration test scenario
 * @class
 */
module.exports = class Base {

  /**
   * Builds a scenario with a name and data fixture
   *
   * @param {String} name - test's name
   * @param {Object} fixtures - test data fixtures
   */
  constructor(name, fixtures) {
    this.name = name;
    this.fixtures = fixtures;
  }

  /**
   * Returns a function that, when executed, will performs the test.
   * Contains any code needed by the scenario.
   *
   * The generated function prototype can have 3 flavours:
   * - void: function(): synchrnous, no parameters, no return
   * - void: function(cb): asynchronous, invoke cb when finished, with optional error as single parameter.
   * - Promise: function(): asynchronous, returns a promise fullfilled when finished (or errored)
   *
   * In any case, thrown exceptions (in case of failing assertions) will be caught using domains,
   * and lead to test failure
   *
   * @private
   * @return {Function} the test function
   */
  generate() {
    return () => {
      throw new Error(`generateTest() not implemented for SpecBase`);
    };
  }
};
