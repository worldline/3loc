'use strict';

const cluster = require(`cluster`);

// code coverage can't be computed for this branch because it's executed on separated process
/* istanbul ignore else */
if (cluster.isMaster) {
  // master code: the file to spawn will also be executor.jd
  cluster.setupMaster({
    exec: __filename,
    silent: true
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

  // master will send the file to execute
  process.on(`message`, file => {
    // execute the code
    const test = require(file);
    if (test.length === 1) {
      // callback style
      test((err, result) => {
        if (err) {
          throw err;
        }
        end(result);
      });
    } else {
      // run to get a promise...
      let result = test();
      if (result instanceof Promise) {
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
 * @param {String} file - absolute or relative path of executed JS file
 * @return {Promise<String>} fullfilled with scenario result (if any)
 */
module.exports = file =>
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

    // trigger execution
    worker.send(file);
  });