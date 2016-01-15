'use strict';

const fs = require(`fs`);
const path = require(`path`);
const nunjucks = require(`nunjucks`);

// use a dedicated Nunjucks environmenent for compilation
const compiler = new nunjucks.Environment(null, {
  autoescape: false,
  // allows to warn on unreplaced values
  throwOnUndefined: true,
  tags: {
    blockStart: `<%`,
    blockEnd: `%>`,
    variableStart: `<$`,
    variableEnd: `$>`,
    commentStart: `<#`,
    commentEnd: `#>`
  }
});

// add a stringify filter to pass data structures
compiler.addFilter(`stringify`, JSON.stringify);

/**
 * Loads body from a given file
 * @param {String} file - relative or absolute path to file
 * @param {String} encoding = utf8 - encoding used for reading
 * @return {Promise<String>} fullfilled with file's content
 */
exports.load = (file, encoding) =>
  new Promise((resolve, reject) => {
    fs.readFile(path.resolve(file), encoding || 'utf8', (err, content) => {
      if (err) {
        return reject(new Error(`Failed to load file: ${err.message}`));
      }
      resolve(content);
    });
  });

/**
 * Make a body by parsing template in a given context and making needed replacements.
 * Uses Nunjucks templating engine
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
      resolve(compiler.renderString(template, context));
    } catch (err) {
      reject(new Error(`Failed to compile template: ${err.message}`));
    }
  });
