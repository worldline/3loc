'use strict';

const fs = require(`fs`);
const path = require(`path`);
const tmpDir = require(`os`).tmpdir();
const fileUtils = require(`../utils/file`);

/**
 * Loads a scenario content and makes replacement with fixtures provided
 * Compiles the result into a Javascript file saved in temporary folder
 *
 * @param {String} scenario - absolute or relative path of loaded scenario
 * @param {Object} fixtures - data used as fixtures
 * @return {Promise<String>} fullfilled with generated file absolute path
 */
module.exports = (scenario, fixtures) =>
  fileUtils.load(scenario).
    then(content => fileUtils.compile(content, fixtures)).
    then(content => new Promise((resolve, reject) => {
      const generatedPath = path.join(tmpDir, path.basename(scenario));
      fs.writeFile(generatedPath, content, err => {
        if (err) {
          return reject(err);
        }
        resolve(generatedPath);
      });
    }));
