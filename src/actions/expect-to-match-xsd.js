'use strict';

const _ = require(`lodash`);
const Joi = require(`joi`);
const basename = require(`path`).basename;
const libxml = require(`libxmljs`);
const expect = require(`chai`).expect;
const AssertionError = require(`chai`).AssertionError;
const utils = require(`../utils/object`);
const logger = require(`../utils/logger`)(`expect:xsd`);

/**
 * Validates incoming content against a given XSD content.
 * Use libXML.js internally.
 * XSD and XML content can be passed as plain string, or as libXML.js's Document objects
 *
 * If xsd is given as a function, it must return a promise fulfilled
 * with an object including a `content` property.
 *
 * @example
 * run(request({'http://somewhere.com/api'})).
 * then(expectToMatchXsd(load('schema.xsd')))
 *
 * @param {String|Object|Function} xsd - xsd content used for validation
 * @return {Function} function usable in promises chain.
 * Takes as first parameter an object containing
 * - {String|Object} content - xml content validated
 * Returns a promise fulfilled with the same object, where content has been enriched as a libXML.js's Document
 */
module.exports = xsd => {
  Joi.assert(xsd, Joi.alternatives().try(
    Joi.string(),
    Joi.object().type(libxml.Document),
    Joi.func()
  ).required(), `matchXsd expectation`);

  // resolve xsd if provided as a promise
  return args => (_.isFunction(xsd) ?
      Promise.resolve({}).then(xsd) : Promise.resolve({content: xsd})).
    then(result => {
      if (_.isString(result.content)) {
        result.content = libxml.parseXmlString(result.content);
      }
      expect(args, utils.printContext('no content to validate', args._ctx)).to.have.property(`content`);
      const xml = _.isString(args.content) ? libxml.parseXmlString(args.content) : args.content;
      // run validation
      if (!xml.validate(result.content)) {
        throw new AssertionError(`${utils.printContext(`invalid XML`, args._ctx)}: ${xml.validationErrors.map(err => err.message).join(`\n`).trim()}`);
      }
      // reuse enriched version
      args.content = xml;
      logger.debug(`xml is valid against ${args.path ? basename(args.path) : `xsd`}`);
      return args;
    });
};
