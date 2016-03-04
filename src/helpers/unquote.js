'use strict';

/**
 * Nunjucks helper to remove quotes from strings
 */
module.exports = function unquote(value) {
    const str = new String(value);
    str.unquote = true;
    return str;
}
