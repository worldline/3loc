'use strict';

const Base = require(`./base`);
const Request = require(`./request`);
const express = require(`express`);
// const chai = require(`chai`);
const Joi = require(`joi`);
const number = Joi.number;

// chai.config.truncateThreshold = 0;

/**
 * Integration scenario that:
 * - launches a server
 * - performs an http request on a distant server
 * - awaits for a hit on the launched server
 * @class
 */
module.exports = class RequestAndListen extends Base {

  /**
   * @returns {Joi.object} Schema used to validate fixtures.
   * An extension of Request's schema plus:
   * - {Number} listeningPort - local port on which the server will listen
   */
  static get schema() {
    return Request.schema.keys({
      listeningPort: number().required()
    });
  }

  /**
   * - start a server
   * - sends an HTTP request
   * - validates its response
   * - awaits for a request on server and validates it
   * - sends a given response
   * @param {Function} done - invoked when the scenario is complete,
   * with an optionnal Error as first argument
   */
  test(done) {
    const app = express();
    let server;

    const end = err => {
      server.close(() => done(err));
    };

    app.get(`/`, (req, res) => {
      // TODO validate request
      res.end();
      end();
    });

    server = app.listen(this.fixtures.listeningPort, () => {
      new Request(`${this.name} - request`, this.fixtures).run().catch(end);
    });
    server.on(`error`, end);
  }
};
