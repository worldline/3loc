'use strict';

const fs = require('fs');
const resolvePath = require('path').resolve;
const basename = require('path').basename;
const parse = require('csv-parse');

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
 * @param {Function} SpecClass - constructor used to build spec
 * @param {String} content - parsed file content
 * @return {Promise<Array<Spec>>} promise resolved with the array of parsed test specifications
 */
const parseFile = (SpecClass, content) =>
  new Promise((resolve, reject) =>
    // extract content with csv-parse function
    parse(content, parserOpts, (err, specs) => {
      if (err) {
        return reject(err);
      }
      let i = 0;
      resolve(specs.map(fixtures => new SpecClass(`test ${++i}`, fixtures)));
    })
  );

/**
 * Tries to load a spec class from the CSV file name
 * File name must not includes its path, and must contain a dash (-).
 * Everything between the dash and the extension is considered as the spec class name
 *
 * @param {String} filename - CSV fixture filename
 * @return {Function} the matching spec class
 * @throws {Error} if filename does not includes a class name, or if no matching class found
 */
const loadSpec = filename => {
  const match = /^.+-(.+)\..+$/.exec(filename);
  if (!match || !match[1]) {
    throw new Error(`${filename} does not includes a test template id`);
  }
  const className = match[1];
  try {
    return require(`../spec/${className}`);
  } catch (exc) {
    throw new Error(`${className} is not a known test template id`);
  }
};

/**
 * Reads spec file and return an array of test cases
 * TODO describe test structure
 * TODO describe file content
 *
 * @param {String} specPath - full or relative path to spec file
 * @return {Promise<Array<Spec>>} resolved with the read specification as parameter
 */
const parseSpecs = specPath => {
  return new Promise((resolve, reject) => {
    try {
      const specClass = loadSpec(basename(specPath));
      // opens the specified file as utf8
      fs.readFile(resolvePath(specPath), {encoding: 'utf8'}, (err, content) => {
        if (err) {
          return reject(err);
        }
        // parsing might throw exception that will reject promise
        resolve(parseFile(specClass, content));
      });
    } catch (exc) {
      reject(new Error(`failed to load test template: ${exc.message}`));
    }
  });
};

module.exports = parseSpecs;
