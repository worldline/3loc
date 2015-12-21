'use strict';

const SpecBase = require('./base');
const chai = require('chai');
const request = require('request');
const expect = chai.expect;

chai.config.truncateThreshold = 0;

/**
 * Integration test that performs an http request on a distant server
 * @class
 */
module.exports = class RequestSpec extends SpecBase {

  /**
   * Builds a specification with a name and data fixture
   * @param {String} name - test's name
   * @param {Object} fixtures - test data fixtures
   */
  constructor(name, fixtures) {
    super(name, fixtures);

    expect(this.fixtures).to.have.property('host').that.is.a('string');
    expect(this.fixtures).to.have.property('url').that.is.a('string');
    expect(this.fixtures).to.have.property('code').that.is.a('number');
  }

  /**
   * Generates a test that makes a request on the server with supertest
   * @return {Function} the test content.
   */
  generateTest() {
    return done =>
      request.get(this.fixtures.host + this.fixtures.url, (err, resp) => {
        expect(err, 'Unexpected network error').not.to.exist;
        expect(resp, 'Unexpected HTTP response code').to.have.property('statusCode').that.equals(this.fixtures.code);
        done();
      });
  }
};
