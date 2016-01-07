'use strict';

const Base = require(`./base`);
const chai = require(`chai`);
const request = require(`request`);
const Joi = require(`joi`);
const Hogan = require(`hogan`);
const fs = require(`fs`);
const path = require(`path`);
const object = Joi.object;
const string = Joi.string;
const number = Joi.number;
const expect = chai.expect;

chai.config.truncateThreshold = 0;

/**
 * Loads body from a given file
 * @param {String} file - relative or absolute path to file
 * @return {Promise<String>} promised resolved with file's content
 */
const loadFromFile = file =>
  new Promise((resolve, reject) => {
    fs.readFile(path.resolve(file), 'utf8', (err, content) => {
      if (err) {
        return reject(new Error(`Failed to load template file: ${err.message}`));
      }
      resolve(content);
    });
  });

/**
 * Make a body by parsing template in a given context and making needed replacements.
 * Uses Mustache templating with Hogan
 * @param {String} template - template content
 * @param {Object} context - context data, used for template filling.
 * @return {Promise<String>} promised resolved with actual body
 */
const compileTemplate = (template, context) =>
  new Promise((resolve, reject) => {
    if (!template) {
      return resolve(template);
    }
    try {
      resolve(Hogan.compile(template).render(context));
    } catch (err) {
      reject(new Error(`Failed to compile mustache template: ${err.message}`));
    }
  });

/**
 * Integration scenario that performs an http request on a distant server
 * @class
 */
module.exports = class Request extends Base {

  /**
   * @returns {Joi.object} Schema used to validate fixtures
   * - {String} host - requested server url (protocol, host and port)
   * - {String} url - requested url (with url-encoded parameters)
   * - {String} method - request protocol method used (default to 'GET')
   * - {String} body - relative or absolute path to the request body content (exclusive with bodyStr, default to empty)
   * - {String} bodyStr - request body content (exclusive with body, default to empty)
   * - {Number} code - expected Http response status code
   */
  static get schema() {
    return object().keys({
      host: string().required().regex(/^https?:\/\//),
      url: string().required().min(1),
      method: string().valid(`GET`, `POST`, `PUT`, `HEAD`, `DELETE`),
      body: string(),
      bodyStr: string(),
      code: number().required(),
      contentType: string()
    }).unknown(true).nand(`body`, `bodyStr`);
  }

  /**
   * Returns the test that makes the HTTP request and validates response
   *
   * @return {Function} the test function.
   */
  generate() {
    return () => {
      let tpl = this.fixtures.body ? loadFromFile(this.fixtures.body) : Promise.resolve(this.fixtures.bodyStr);
      return tpl.
        then(content => compileTemplate(content, this.fixtures)).
        then(body => new Promise(resolve => {
          // console.log(`send body ${body}`);
          request({
            method: this.fixtures.method || `GET`,
            url: this.fixtures.host + this.fixtures.url,
            followRedirect: false,
            headers: {
              'Content-Type': this.fixtures.contentType || `text/plain`
            },
            body
          }, (err, resp) => {
            expect(err, `Unexpected error`).not.to.exist;
            expect(resp, `Unexpected HTTP status code`).to.have.property(`statusCode`).that.equals(this.fixtures.code);
            // TODO response validation
            resolve();
          });
        }));
    };
  }
};
