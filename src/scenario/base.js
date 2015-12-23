'use strict';

const assert = require(`joi`).assert;
const any = require(`joi`).any;

/**
 * Represents an integration test scenario
 * @class
 */
module.exports = class Base {

  /**
   * Accepts any fixtures.
   * @returns {Joi.Any} A Joi schema used within scenario constructor to validates incoming fixtures.
   */
  static get schema() {
    return any();
  }

  /**
   * Name of the property in features that contains test name
   * @returns {String}, default to 'name'
   */
  static get nameProperty() {
    return `name`;
  }

  /**
   * Builds a scenario with a name and data fixture
   *
   * @param {String} name - test's name
   * @param {Object} fixtures - test data fixtures
   */
  constructor(name, fixtures) {
    this.name = name;
    if (!fixtures) {
      throw new Error(`can't create ${this.constructor.name} scenario without fixtures`);
    }
    assert(fixtures, this.constructor.schema);
    this.fixtures = fixtures;
  }

  /**
   * Run the scenario, for example when using from another scenario.
   *
   * @returns {Promise} fullfilled when scenario is done.
   */
  run() {
    const test = this.generate();
    return new Promise((resolve, reject) => {
      if (test.length === 1) {
        // callback style
        test(err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        // run to get a promise...
        let result = test();
        if (result instanceof Promise) {
          // if it's a promise, resolve later
          result.then(resolve).catch(reject);
        } else {
          // if not, then resolve manually
          resolve();
        }
      }
    });
  }

  /**
   * @private
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
   * @return {Function} the test function
   */
  generate() {
    return () => {
      throw new Error(`generateTest() not implemented for SpecBase`);
    };
  }
};
