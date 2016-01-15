'use strict';

const libxml = require(`libxmljs`);
const _ = require(`lodash`);
const basename = require(`path`).basename;
const Joi = require(`joi`);

// schema to enforce incoming options
const schema = Joi.object().keys({
  xml: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
  xsd: Joi.alternatives().try(Joi.string(), Joi.object()).required()
}).unknown();

/**
 * Validates a xml document against a given xsd.
 * Use libXML.js internally.
 * Parameters can be passed as plain string, or as libXML.js's Document objects
 *
 * @param {Object} opt - option to configure validation
 * @param {String|Object} opt.xml - xml content to validate
 * @param {String|Object} opt.xsd - xsd content used for validation
 * @param {Object} opt._ctx = {} - internal context used for reporting
 * @return {Promise<String>} fulfilled with the option object modified with:
 * @return {String} xml - libXML.js's XML Document object
 * @return {Object} xsd - libXML.js's XML Document object
 */
module.exports = opt => {
  Joi.assert(opt, schema);
  opt._ctx = opt._ctx || {stack: []};
  opt._ctx.stack.push(`validate against xsd${opt.path ? ` ${basename(opt.path)}` : ``}`);
  return new Promise((resolve, reject) => {
    // parse and turns string to objects
    const xml = _.isString(opt.xml) ? libxml.parseXmlString(opt.xml) : opt.xml;
    const xsd = _.isString(opt.xsd) ? libxml.parseXmlString(opt.xsd) : opt.xsd;
    const isValid = xml.validate(xsd);
    if (isValid) {
      opt.xsd = xsd;
      opt.xml = xml;
      return resolve(opt);
    }
    // errors are directly embedded in xml object
    reject(new Error(`Invalid XML response:
${xml.validationErrors.map(err => err.message).join(`\n`)}`));
  });
};
