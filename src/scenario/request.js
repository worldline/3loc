'use strict';

const Base = require(`./base`);
const chai = require(`chai`);
const request = require(`request`);
const Joi = require(`joi`);
const Hogan = require(`hogan`);
const fs = require(`fs`);
const path = require(`path`);
const libxml = require(`libxmljs`);
const object = Joi.object;
const string = Joi.string;
const number = Joi.number;
const expect = chai.expect;

chai.config.truncateThreshold = 0;

/**
 * Loads body from a given file
 * @param {String} file - relative or absolute path to file
 * @return {Promise<String>} fullfilled with file's content
 */
const loadFromFile = file =>
  new Promise((resolve, reject) => {
    fs.readFile(path.resolve(file), 'utf8', (err, content) => {
      if (err) {
        return reject(new Error(`Failed to load file: ${err.message}`));
      }
      resolve(content);
    });
  });

/**
 * Make a body by parsing template in a given context and making needed replacements.
 * Uses Mustache templating with Hogan
 * @param {String} template - template content
 * @param {Object} context - context data, used for template filling.
 * @return {Promise<String>} fullfilled with actual body, or nothing if no template provided
 */
const compileTemplate = (template, context) =>
  new Promise((resolve, reject) => {
    // no template: do not fail
    if (!template) {
      return resolve();
    }
    try {
      resolve(Hogan.compile(template).render(context));
    } catch (err) {
      reject(new Error(`Failed to compile mustache template: ${err.message}`));
    }
  });

/**
 * Parse a XSD string into a enriched XSD object for further validation.
 * Uses libXML
 * @param {String} xsd - XSD content
 * @return {Promise<Object>} fullfilled with the XSD object, or nothing if no xsd provided
 */
const compileXSD = xsd =>
  new Promise((resolve, reject) => {
    // no template: do not fail
    if (!xsd) {
      return resolve();
    }
    try {
      resolve(libxml.parseXmlString(xsd));
    } catch (err) {
      reject(new Error(`Failed to compile XSD: ${err.message}`));
    }
  });

/**
 * Validates the incoming XML content against the given XSD
 * @param {String} xml - validated content
 * @param {Object} xsd - XSD object
 * @return {Promise} fullfilled if xml is valid
 */
const validateAgainstXSD = (xml, xsd) =>
  new Promise((resolve, reject) => {
    // no xsd provided: no validation, but do not fail
    if (!xsd) {
      return resolve(xml);
    }
    // parse and turns string to objects
    xml = libxml.parseXmlString(xml);
    const isValid = xml.validate(xsd);
    if (isValid) {
      return resolve(xml);
    }
    // errors are directly embedded in xml object
    reject(new Error(`Invalid XML response:
${xml.validationErrors.map(err => err.message).join(`\n`)}`));
  });

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
    let loadTpl = this.fixtures.body ? loadFromFile(this.fixtures.body) : Promise.resolve(this.fixtures.bodyStr);
    let loadXsd = this.fixtures.xsd ? loadFromFile(this.fixtures.xsd) : Promise.resolve(this.fixtures.xsdStr);
    return loadTpl.
      then(content => compileTemplate(content, this.fixtures)).
      then(body => loadXsd.then(compileXSD).then(xsd =>
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
        then(xml => validateAgainstXSD(xml, xsd))
      ));
  }
};
