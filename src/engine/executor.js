'use strict';

const cluster = require(`cluster`);
const actions = require(`../actions`);
const getType = require(`../utils/object`).getType;

// code coverage can't be computed for this branch because it's executed on separated process
/* istanbul ignore else */
if (cluster.isMaster) {
  // master code: the file to spawn will also be executor.jd
  cluster.setupMaster({
    exec: __filename,
    silent: false
  });
} else {
  // in that particular case, we WANT worker process to exit after execution/error
  /* eslint no-process-exit: 0 */

  const errorHandler = err => {
    // errors can't be serialized with JSON.stringify
    process.send({
      err: {
        message: err.message,
        stack: err.stack,
        kind: err.constructor.name
      }
    });
    // kill worker
    process.exit(0);
  };

  const end = result => {
    // send results back to master
    process.send({result});
    process.exit(0);
  };

  // worker code: report uncaught exceptions to master
  process.on(`unhandledRejection`, errorHandler);
  process.on(`uncaughtException`, errorHandler);

  // master will send the code to execute
  process.on(`message`, code => {
    // console.log(code);

    // we will give as parameters every actions defined
    // + the require() function and process variable
    const parameterNames = [`require`, `process`];
    const parameters = [require, process];
    for (let actionName in actions) {
      parameterNames.push(actionName);
      parameters.push(actions[actionName]);
    }
    // executed code is the last parameter
    parameterNames.push(code);
    // in that case, we DO want to execute generated code
    /* eslint no-new-func: 0 */
    const test = Function.apply({}, parameterNames).apply({}, parameters);
    if (test instanceof Promise) {
      // it's already a Promise
      test.then(end);
    } else if (test.length === 1) {
      // it's a function awaiting a callback
      test((err, result) => {
        if (err) {
          throw err;
        }
        end(result);
      });
    } else {
      // it's a function that may return a promise...
      let result = test();
      if (getType(result) === 'object' && getType(result.then) === 'function') {
        // if it's a promise, resolve later
        result.then(end);
      } else {
        // if not, then resolve manually
        end(result);
      }
    }
  });
}

/**
 * Execute a test in a sand box, gathering results and exceptions properly
 *
 * @param {String} code - executed code as a string
 * @param {String} basedir = '.' - path used as execution working folder, default to execution folder
 * @return {Promise<String>} fullfilled with scenario result (if any)
 */
module.exports = (code, basedir) =>
  new Promise((resolve, reject) => {
    // prepare dedicated process for code execution
    const worker = cluster.fork();
    // wait for error or result
    worker.on(`message`, message => {
      if (message.err) {
        // reconstruct error object, especially its stack
        const Constructor = global[message.err.kind] || Error;
        const err = new Constructor(message.err.message);
        err.stack = message.err.stack;
        return reject(err);
      }
      // or resolve with execution result
      resolve(message.result);
    });

    // trigger execution, setting the current directory if needed
    const workdir = (basedir || process.cwd()).replace(/\\/g, '\\\\');
    worker.send(`process.chdir('${workdir}');\n${code}`);
  });
