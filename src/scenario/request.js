'use strict';

const Base = require(`./base`);
const chai = require(`chai`);
const request = require(`request`);
const Joi = require(`joi`);
const object = Joi.object;
const string = Joi.string;
const number = Joi.number;
const expect = chai.expect;

chai.config.truncateThreshold = 0;

/**
 * Integration scenario that performs an http request on a distant server
 * @class
 */
module.exports = class Request extends Base {

  /**
   * @returns {Joi.object} Schema used to validate fixtures
   * - {String} host - requested server url (protocol, host and port)
   * - {String} url - requested url (with url-encoded parameters)
   * - {Number} code - expected Http code
   */
  static get schema() {
    return object().keys({
      host: string().required().regex(/^https?:\/\//),
      url: string().required().min(1),
      code: number().required()
    }).unknown(true);
  }

  /**
   * Returns the test that makes the HTTP request and validates response
   *
   * @return {Function} the test function.
   */
  generate() {
    return done =>
      request({
        // TODO in fixtures
        method: `GET`,
        url: this.fixtures.host + this.fixtures.url,
        followRedirect: false
      }, (err, resp) => {
        expect(err, `Unexpected network error`).not.to.exist;
        expect(resp, `Unexpected HTTP status code`).to.have.property(`statusCode`).that.equals(this.fixtures.code);
        done();
      });
  }
};
