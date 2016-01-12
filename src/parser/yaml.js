'use strict';

const fs = require(`fs`);
const resolvePath = require(`path`).resolve;
const basename = require(`path`).basename;
const yaml = require(`js-yaml`);

/**
 * Parse incoming file content into an array of test cases
 *
 * @param {String} filename - YAML file name
 * @param {String} content - parsed file content
 * @return {Promise<Array<Scenario>>} promise resolved with the array of parsed test specifications
 */
const parseFile = (filename, content) =>
  new Promise(resolve => {
    // extract content with csv-parse function
    const spec = yaml.safeLoad(content);
    // validates spec class name
    if (!spec.scenario) {
      throw new Error(`${filename} does not include scenario id`);
    }
    try {
      const Scenario = require(`../scenario/${spec.scenario}`);
      let result = [];
      if (Array.isArray(spec.tests)) {
        result = spec.tests.map((fixture, i) => {
          let name = fixture[Scenario.nameProperty] || `test ${i + 1}`;
          delete fixture.name;
          return new Scenario(name, fixture);
        });
      }
      resolve(result);
    } catch (exc) {
      throw new Error(`${spec.scenario} is not a known scenario`);
    }
  });

/**
 * Reads spec file and return an array of test cases
 * Incoming yaml must contain a Map with keys:
 * - scenario {String} - case-sensitive name of the scenario used (in src/scenario folder)
 * - tests {Array<Object>} - list of tests to be run. Each test is a fixtures given to the
 * Scenario instance. Depending on the Scenario, a test name is extracted or generated
 *
 * @param {String} specPath - full or relative path to spec YAML file
 * @return {Promise<Array<Scenario>>} resolved with the read scenarii as parameter
 */
module.exports = specPath => {
  return new Promise((resolve, reject) => {
    specPath = resolvePath(specPath);
    // opens the specified file as utf8
    fs.readFile(specPath, {encoding: `utf8`}, (err, content) => {
      if (err) {
        return reject(err);
      }
      // parsing might throw exception that will reject promise
      resolve(parseFile(basename(specPath), content));
    });
  });
};
