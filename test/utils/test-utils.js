'use strict';

/**
 * Purge string from ANSI styles (starting with \u001b character)
 *
 * @param {String} str - string to purge
 * @return {String} purged version of the string
 */
exports.purgeStyle = str => {
  return str.replace(/\u001b\[\d+m/g, '');
};

/**
 * Avoid specified loggers ouput to be traced.
 * Must be called within a given Mocha `describe()`.
 * Shutdown is limited to this enclosing describe, and loggers initial
 * levels will be restored.
 *
 * @param {String|Array<String>} names - logger(s) names to shutdown
 */
exports.shutdownLoggers = names => {

  if (!Array.isArray(names)) {
    names = [names];
  }

  let levels = [];

  before(() => {
    levels = names.map(name => {
      const logger = require(`../../src/utils/logger`)(name);
      const level = logger.level;
      logger.level = `off`;
      return level;
    });
  });

  after(() => {
    names.forEach((name, i) => {
      require(`../../src/utils/logger`)(name).level = levels[i];
    });
  });
};

/**
 * Make a function immediately runnable as a promise
 * @param {Function} fn - function immediately run
 * @param {Object} data = {} - optionnal data give as argument to the function
 * @return {Promise} fulfilled with the function result
 */
exports.run = (fn, data) => Promise.resolve(data || {}).then(fn);

/**
 * Generates a random integer in interval [0..100000[
 * @return {Number} a random integer
 */
exports.randomInt = () => Math.floor(Math.random() * 10000);
