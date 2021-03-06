'use strict';

const Joi = require(`joi`);
const logger = require(`../utils/logger`)(`act:serial`);

/**
 * Runs an array of function serially,
 * passing result of task N as parameter of task N+1.
 *
 * Beware that you must pass an array **functions**.
 * Don't give promises, or they will be started all in once.
 *
 * @example
 * runSerial([
 *   () => Promise.resolve(1),
 *   p => Promise.resolve(p + 1)
 * ].then(result => ...) // result === 2
 *
 * @param {Array<Function>} tasks - task to be executed
 * @return {Function} that when invoked, will return promise fulfilled
 * with the latest task's result
 */
module.exports = tasks => {
  Joi.assert(tasks, Joi.array().items(Joi.func()), `runSerial action`);
  return () => tasks.reduce((cur, next, i) => {
    return cur.then(next).then(res => {
      logger.debug(`task ${i + 1} executed`);
      return Promise.resolve(res);
    });
  }, Promise.resolve());
};
