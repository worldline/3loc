'use strict';

const assert = require(`joi`).assert;
const any = require(`joi`).any;
const generate = require(`./generator`);
const execute = require(`./executor`);

/**
 * Represents an integration test
 * @class
 */
module.exports = class Test {

  /**
   * Accepts any fixtures.
   * @returns {Joi.Any} A Joi schema used within scenario constructor to validates incoming fixtures.
   */
  static get schema() {
    return any();
  }

  /**
   * Builds a test with a name from a scenario file and data fixture
   * @param {String} name - test's name
   * @param {String} file - scenario file path or directly scenario content
   * @param {Object} fixtures - test data fixtures
   * @param {String} workdir = '.' - path used as execution working folder
   */
  constructor(name, file, fixtures, workdir) {
    this.name = name;
    this.file = file;
    this.workdir = workdir || `.`;
    if (!fixtures) {
      throw new Error(`can't create ${this.constructor.name} scenario without fixtures`);
    }
    assert(fixtures, this.constructor.schema);
    this.fixtures = fixtures;
  }

  /**
   * Run the scenario, for example when using from another scenario.
   * @returns {Promise} fullfilled when scenario is done with its result.
   */
  run() {
    return generate(this.file, this.fixtures).
      then(content => execute(content, this.workdir));
  }
};
