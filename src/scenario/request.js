'use strict';

const Base = require(`./base`);
const chai = require(`chai`);
const request = require(`request`);
const Joi = require(`joi`);
const xmlUtils = require(`../utils/xml`);
const fileUtils = require(`../utils/file`);

const object = Joi.object;
const string = Joi.string;
const number = Joi.number;
const expect = chai.expect;

chai.config.truncateThreshold = 0;

/**
 * Integration scenario that performs an http request on a distant server
 * You can provide the request body as a file (or string), with optionnal Mustache templating
 * (Mustache data are the scenario's fixtures).
 *
 * HTTP response status is checked, and you can also provides an XSD (as a file or a string)
 * for validation. In that case, the returned response is parsed with libXML.js as a Document
 * object.
 *
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
   * - {String} xsd - relative or absolute path to the XSD file used to validate response (exclusive with xsdStr)
   * - {String} xsdStr - XSD string used to validate response (exclusive with xsd)
   */
  static get schema() {
    return object().keys({
      host: string().required().regex(/^https?:\/\//),
      url: string().required().min(1),
      method: string().valid(`GET`, `POST`, `PUT`, `HEAD`, `DELETE`),
      body: string(),
      bodyStr: string(),
      code: number().required(),
      contentType: string(),
      xsd: string()
    }).
      unknown(true).
      nand(`body`, `bodyStr`).
      nand(`xsd`, `xsdStr`);
  }

  /**
   * Makes the HTTP request and validates response
   * @return {Promise<Object>} fullfilled with the parsed response (String or libXML.js's Document)
   */
  test() {
    let loadTpl = this.fixtures.body ? fileUtils.load(this.fixtures.body) : Promise.resolve(this.fixtures.bodyStr);
    let loadXsd = this.fixtures.xsd ? fileUtils.load(this.fixtures.xsd) : Promise.resolve(this.fixtures.xsdStr);
    return loadTpl.
      then(content => fileUtils.compile(content, this.fixtures)).
      then(body => loadXsd.then(xmlUtils.compile).then(xsd =>
        new Promise(resolve =>
          request({
            method: this.fixtures.method || `GET`,
            url: this.fixtures.host + this.fixtures.url,
            followRedirect: false,
            headers: {
              'Content-Type': this.fixtures.contentType || `text/plain`
            },
            body
          }, (err, resp, parsedBody) => {
            expect(err, `Unexpected error`).not.to.exist;
            expect(resp, `Unexpected HTTP status code`).to.have.property(`statusCode`).that.equals(this.fixtures.code);
            resolve(parsedBody);
          })
        ).
        // XML validation if needed
        then(xml => xmlUtils.validate(xml, xsd))
      ));
  }
};
