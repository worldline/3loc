'use strict';

const SpecBase = require('./base');
const chai = require('chai');
const request = require('request');
const expect = chai.expect;

chai.config.truncateThreshold = 0;

/**
 * Integration scenario that performs an http request on a distant server
 * @class
 */
module.exports = class RequestSpec extends SpecBase {

  /**
   * Builds a scenario with a name and data fixture
   *
   * @param {String} name - test's name
   * @param {Object} fixtures - test data fixtures
   * @param {String} fixtures.host - requested server url (protocol, host and port)
   * @param {String} fixtures.url - requested url (with url-encoded parameters)
   * @param {Number} fixtures.code - expected Http code
   */
  constructor(name, fixtures) {
    super(name, fixtures);

    expect(this.fixtures).to.have.property('host').that.is.a('string');
    expect(this.fixtures).to.have.property('url').that.is.a('string');
    expect(this.fixtures).to.have.property('code').that.is.a('number');
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
        method: 'GET',
        url: this.fixtures.host + this.fixtures.url,
        followRedirect: false
      }, (err, resp) => {
        expect(err, 'Unexpected network error').not.to.exist;
        expect(resp, 'Unexpected HTTP response code').to.have.property('statusCode').that.equals(this.fixtures.code);
        done();
      });
  }
};
