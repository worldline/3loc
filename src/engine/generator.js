'use strict';

const fs = require(`fs`);
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
  // TODO scenario is loaded from execution folder and not spec file
  new Promise(resolve => fs.exists(scenario, resolve)).
    then(exists => exists ? fileUtils.load(scenario) : scenario).
    then(content => fileUtils.compile(content, fixtures));
