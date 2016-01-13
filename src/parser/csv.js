'use strict';

const fs = require(`fs`);
const resolvePath = require(`path`).resolve;
const parseCsv = require(`csv-parse`);
const utils = require(`../utils/object`);
const Test = require(`../engine/test`);

const parserOpts = {
  /* eslint camelcase: 0 */
  auto_parse: true,
  // toggle columns auto-discovery on first line
  columns: true,
  delimiter: `;`,
  skip_empty_lines: true
};


/**
 * Try to smartly cast incoming values.
 * String containing 'true' and 'false' (case insensitive, leading/trailing spaces allowed)
 * will be cast to booleans
 * @param {Any} value - incoming value
 * @return {String|Boolean} casted value
 */
const cast = value => {
  if (utils.getType(value) === `string`) {
    if (value.trim().toLowerCase() === `true`) {
      return true;
    } else if (value.trim().toLowerCase() === `false`) {
      return false;
    }
  }
  return value;
};

/**
 * Takes the flatten fixtures and turns them into a object tree
 * @param {Object} fixtures - flatten fixtures
 * @return {Object} treeish fixtures
 */
const unflatten = fixtures => {
  const result = {};
  Object.keys(fixtures).forEach(prop => utils.setProp(result, prop, cast(fixtures[prop])));
  return result;
};

/**
 * Parse incoming file content into an array of test cases
 * Test scenario is in 'scenario' CSV column, and test name in 'name' CSV column (or generated)
 *
 * @param {String} content - parsed file content
 * @return {Promise<Array<Scenario>>} promise resolved with the array of parsed test specifications
 */
const parseFile = content =>
  new Promise((resolve, reject) =>
    // extract content with csv-parse function
    parseCsv(content, parserOpts, (err, fixtures) => {
      if (err) {
        return reject(err);
      }
      const tests = [];
      let i = 1;
      for (let fixture of fixtures) {
        let name = fixture.name || `test ${i++}`;
        let scenario = fixture.scenario;
        if (!scenario) {
          reject(new Error(`Missing scenario for test ${name}`));
          break;
        }
        delete fixture.name;
        delete fixture.scenario;
        tests.push(new Test(name, scenario, unflatten(fixture)));
      }
      resolve(tests);
    })
  );

/**
 * Reads spec file and return an array of test cases.
 * CSV delimiter is semi-colon (;)
 * Expected CSV columns are:
 * - scenario: path to scenario used for this test
 * - name (Optionnal): test name, will be generated if not found
 * Every other columns are used as test fixtures.
 * Column names containing dots (.) will be unflatten into corresponding objects:
 * `req.code` column will give `{req: {code: ...}}` object
 *
 * @param {String} specPath - full or relative path to spec CSV file
 * @return {Promise<Array<Scenario>>} resolved with the read scenarii as parameter
 */
module.exports = specPath => {
  return new Promise((resolve, reject) => {
    // opens the specified file as utf8
    fs.readFile(resolvePath(specPath), {encoding: `utf8`}, (err, content) => {
      if (err) {
        return reject(err);
      }
      resolve(content);
    });
  }).then(parseFile);
};
