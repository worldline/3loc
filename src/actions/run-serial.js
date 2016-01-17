'use strict';

const Joi = require(`joi`);
const makePromisable = require(`../utils/object`).makePromisable;

/**
 * Runs an array of function serially,
 * passing result of task N as parameter of task N+1.
 *
 * @param {Array<Function>} tasks - task to be executed
 * @return {Function} that when invoked, will return promise fulfilled
 * with the latest task's result
 */
module.exports = tasks => {
  Joi.assert(tasks, Joi.array().items(Joi.object().type(Promise)), `runSerial action`);
  return makePromisable(() => tasks.reduce((cur, next) => {
    return cur.then(next).then(Promise.resolve());
  }, Promise.resolve()));
};
