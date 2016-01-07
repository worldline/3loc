'use strict';

const libxml = require(`libxmljs`);

/**
 * Parse a XML string into a enriched XML object for further usage.
 * Uses libXML's Document object
 * @param {String} xml - XML content
 * @return {Promise<Object>} fullfilled with the XML object, or nothing if no input provided
 */
exports.compile = xml =>
  new Promise((resolve, reject) => {
    // no input: do not fail
    if (!xml) {
      return resolve(xml);
    }
    try {
      resolve(libxml.parseXmlString(xml));
    } catch (err) {
      reject(new Error(`Failed to compile XML: ${err.message}`));
    }
  });

/**
 * Validates the incoming XML content against the given XSD
 * @param {String} xml - validated content
 * @param {Object} xsd - XSD object
 * @return {Promise} fullfilled if xml is valid
 */
exports.validate = (xml, xsd) =>
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
