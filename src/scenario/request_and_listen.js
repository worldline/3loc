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
   * @returns {Joi.object} Schema used to validate fixtures
   * - {String} host - requested server url (protocol, host and port)
   * - {String} url - requested url (with url-encoded parameters)
   * - {Number} listeningPort - local port on which the server will listen
   * - {Number} code - expected Http code
   */
  static get schema() {
    return Request.schema.keys({
      listeningPort: number().required()
    });
  }

  /**
   * Returns the test that makes the HTTP request and validates response
   *
   * @return {Function} the test function.
   */
  generate() {
    return done => {
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
    };
  }
};
