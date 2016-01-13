'use strict';

const fs = require(`fs`);
const path = require(`path`);
const tmpDir = require(`os`).tmpdir();
const fileUtils = require(`../utils/file`);

/**
 * Loads a scenario content and makes replacement with fixtures provided
 * Compiles the result into a Javascript file saved in temporary folder
 * Scenario can be provided as a file path (existence checked) or directly
 * as the content string
 *
 * @param {String} scenario - absolute or relative path of loaded scenario,
 * or scenario content as a string
 * @param {Object} fixtures - data used as fixtures
 * @return {Promise<String>} fullfilled with generated file absolute path
 */
module.exports = (scenario, fixtures) =>
  new Promise(resolve => fs.exists(scenario, resolve)).
    then(exists => exists ? fileUtils.load(scenario) : scenario).
    then(content => fileUtils.compile(content, fixtures)).
    then(content => new Promise((resolve, reject) => {
      const filename = `${Math.floor(Math.random() * 100000)}.js`;
      const generatedPath = path.join(tmpDir, filename);
      fs.writeFile(generatedPath, content, err => {
        if (err) {
          return reject(err);
        }
        resolve(generatedPath);
      });
    }));
