'use strict';

const fs = require(`fs`);
const path = require(`path`);
const Hogan = require(`hogan`);

/**
 * Loads body from a given file
 * @param {String} file - relative or absolute path to file
 * @return {Promise<String>} fullfilled with file's content
 */
exports.load = file =>
  new Promise((resolve, reject) => {
    fs.readFile(path.resolve(file), 'utf8', (err, content) => {
      if (err) {
        return reject(new Error(`Failed to load file: ${err.message}`));
      }
      resolve(content);
    });
  });

/**
 * Make a body by parsing template in a given context and making needed replacements.
 * Uses Mustache templating with Hogan
 * @param {String} template - template content
 * @param {Object} context - context data, used for template filling.
 * @return {Promise<String>} fullfilled with actual body, or nothing if no template provided
 */
exports.compile = (template, context) =>
  new Promise((resolve, reject) => {
    // no template: do not fail
    if (!template) {
      return resolve();
    }
    try {
      resolve(Hogan.compile(template).render(context));
    } catch (err) {
      reject(new Error(`Failed to compile mustache template: ${err.message}`));
    }
  });
