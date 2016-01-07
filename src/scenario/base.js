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
    return new Promise((resolve, reject) => {
      // previous uncaught exception handlers
      let listeners = process.listeners(`uncaughtException`);

      // common ending that rewire uncaught exception listeners before exiting
      const end = (err, result) => {
        process.removeListener(`uncaughtException`, end);
        if (listeners) {
          listeners.forEach(listener => process.on(`uncaughtException`, listener));
          listeners = [];
        }

        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      };

      // unwire existing listener and put our own
      process.removeAllListeners(`uncaughtException`);
      process.on(`uncaughtException`, end);

      try {
        if (this.test.length === 1) {
          // callback style
          this.test(end);
        } else {
          // run to get a promise...
          let result = this.test();
          if (result instanceof Promise) {
            // if it's a promise, resolve later
            result.then(res => end(null, res)).catch(end);
          } else {
            // if not, then resolve manually
            end();
          }
        }
      } catch (exc) {
        end(exc);
      }
    });
  }

  /**
   * @private
   * Performs the test.
   * Contains any code needed by the scenario.
   *
   * This function can have 3 different prototypes:
   * - void: function(): synchrnous, no parameters, no return
   * - void: function(cb): asynchronous, invoke cb when finished, with optional error as single parameter.
   * - Promise: function(): asynchronous, returns a promise fullfilled when finished (or errored)
   *
   * In any case, thrown exceptions (in case of failing assertions) will be caught,
   * and lead to test failure
   */
  test() {
    throw new Error(`generateTest() not implemented for SpecBase`);
  }
};
