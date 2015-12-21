'use strict';

const fs = require('fs');
const resolvePath = require('path').resolve;
const parse = require('csv-parse');
const SpecBase = require('../spec/spec-base');

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
 * @param {String} content - parsed file content
 * @return {Promise<Array<Spec>>} promise resolved with the array of parsed test specifications
 */
const parseFile = content =>
  new Promise((resolve, reject) =>
    // extract content with csv-parse function
    parse(content, parserOpts, (err, specs) => {
      if (err) {
        return reject(err);
      }
      let i = 0;
      resolve(specs.map(fixtures => new SpecBase(`test ${++i}`, fixtures)));
    })
  );

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
    // opens the specified file as utf8
    fs.readFile(resolvePath(specPath), {encoding: 'utf8'}, (err, content) => {
      if (err) {
        return reject(err);
      }
      // parsing might throw exception that will reject promise
      resolve(parseFile(content));
    });
  });
};

module.exports = parseSpecs;
