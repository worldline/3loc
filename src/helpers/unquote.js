'use strict';

/**
 * Nunjucks helper to remove quotes from strings
 *
 * @param {String} value - original value
 * @return {String} new string with meta information about unquoting
 */
module.exports = function unquote(value) {
  const str = new String(value); // eslint-disable-line no-new-wrappers
  str.unquote = true;
  return str;
};
