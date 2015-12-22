'use strict';

const fs = require('fs');
const resolvePath = require('path').resolve;
const basename = require('path').basename;
const parseCsv = require('csv-parse');

const parserOpts = {
  /* eslint camelcase: 0 */
  auto_parse: true,
  // toggle columns auto-discovery on first line
  columns: true,
  delimiter: ';',
  skip_empty_lines: true
};

/**
 * Parse incoming file content into an array of test cases
 *
 * @param {Function} Scenario - constructor used to build Scenario
 * @param {String} content - parsed file content
 * @return {Promise<Array<Scenario>>} promise resolved with the array of parsed test specifications
 */
const parseFile = (Scenario, content) =>
  new Promise((resolve, reject) =>
    // extract content with csv-parse function
    parseCsv(content, parserOpts, (err, fixtures) => {
      if (err) {
        return reject(err);
      }
      let i = 0;
      resolve(fixtures.map(fixture => new Scenario(`test ${++i}`, fixture)));
    })
  );

/**
 * Tries to load a Scenario class from the CSV file name
 * File name must not includes its path, and must contain a dash (-).
 * Everything between the dash and the extension is considered as the scenario class name
 *
 * @param {String} filename - CSV fixture filename
 * @return {Function} the matching Scenario class
 * @throws {Error} if filename does not includes a class name, or if no matching class found
 */
const loadScenarioClass = filename => {
  const match = /^.+-(.+)\..+$/.exec(filename);
  if (!match || !match[1]) {
    throw new Error(`${filename} does not includes a test template id`);
  }
  const className = match[1];
  try {
    return require(`../scenario/${className}`);
  } catch (exc) {
    throw new Error(`${className} is not a known test template id`);
  }
};

/**
 * Reads spec file and return an array of test cases
 * TODO describe test structure
 * TODO describe file content
 *
 * @param {String} specPath - full or relative path to spec CSV file
 * @return {Promise<Array<Scenario>>} resolved with the read scenarii as parameter
 */
const parse = specPath => {
  return new Promise((resolve, reject) => {
    try {
      const scenario = loadScenarioClass(basename(specPath));
      // opens the specified file as utf8
      fs.readFile(resolvePath(specPath), {encoding: 'utf8'}, (err, content) => {
        if (err) {
          return reject(err);
        }
        // parsing might throw exception that will reject promise
        resolve(parseFile(scenario, content));
      });
    } catch (exc) {
      reject(new Error(`failed to load test template: ${exc.message}`));
    }
  });
};

module.exports = parse;
