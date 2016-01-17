'use strict';

/**
 * Get the string type of an object
 * @param {Any} obj - the checked object
 * @return {String} the type name
 */
exports.getType = obj => Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();

/**
 * Set the property's value of an object, at a given path.
 * Use dots to dive into sub objects
 * Creates missing sub objects
 * @param {Object} obj - the modified root object
 * @param {String} path - path to the modified value
 * @param {Any} value - the property new value
 * @return {Object} the modified object
 */
exports.setProp = (obj, path, value) => {
  path = path.split(`.`);
  let i = 0;
  let current = obj;
  for (let step of path) {
    i++;
    if (i === path.length) {
      current[step] = value;
    } else {
      if (exports.getType(current[step]) !== 'object') {
        current[step] = {};
      }
      current = current[step];
    }
  }
  return obj;
};

/**
 * Print a comprehensive error message from context
 * @param {String} assertion - error prefix, generally contains the assertion kind
 * @param {Object} context - context object
 * @return {String} human-readable message
 */
exports.printContext = (assertion, context) => {
  const stack = context && context.stack && context.stack.join(`\nthen `);
  return `\n${stack ? `when ${stack}\n` : ``}${assertion}`;
};

/**
 * Get the property's value of an object, at a given path.
 * Use dots to dive into sub objects
 * @param {Object} obj - the modified root object
 * @param {String} path - path to the modified value
 * @return {Object} the searched value, or undefined if the value does not exist
exports.getProp = (obj, path) => {};*/
