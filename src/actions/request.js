'use strict';

const request = require(`request`);
const _ = require(`lodash`);
const Joi = require(`joi`);
const libxml = require(`libxmljs`);

// schema to enforce incoming options
const schema = Joi.object().keys({
  url: Joi.string().required().regex(/^https?:\/\//),
  method: Joi.string().valid(`GET`, `POST`, `PUT`, `HEAD`, `DELETE`),
  body: Joi.alternatives(Joi.string(), Joi.object()),
  headers: Joi.object(),
  followRedirect: Joi.boolean()
});

/**
 * Makes an Http(s) request on a given url.
 *
 * If a JSON body is passed, set default content-type to 'application/json'.
 * If a libXML.js Document body is pased, set default content-type to 'application/xml'.
 * They are still overridable.
 *
 * @param {Object} opt - option to configure request
 * @param {String} opt.url - full url (protocol, host, port, path) requested
 * @param {String} opt.method = GET - method used
 * @param {String} [opt.body] - body sent (only when doing POST and PUT)
 * @param {Object} opt.headers = {content-type: 'text/plain'} - request headers
 * @param {Boolean} opt.followRedirect = false - automatically follows redirection
 * @return {Promise<String>} fulfilled with an object containing
 * @return {String} body - response body received (might be parsed in JSON/XML)
 * @return {Object} headers - response headers
 * @return {Number} code - http status code
 */
module.exports = opt => {
  Joi.assert(opt, schema);
  let body = opt.body;
  // request body default content type and serialization
  let contentType = `text/plain`;
  if (body instanceof libxml.Document) {
    contentType = `application/xml`;
    body = body.toString(true);
  } else if (_.isObject(body)) {
    contentType = `application/json`;
    body = JSON.stringify(body);
  }
  return new Promise((resolve, reject) => {
    request({
      method: opt.method || `GET`,
      url: opt.url,
      followRedirect: opt.followRedirect || false,
      headers: _.assign({}, {
        'content-type': contentType
      }, opt.headers || {}),
      body
    }, (err, resp, parsedBody) => {
      if (err) {
        return reject(err);
      }
      // response parsing, if possible
      try {
        if (/\/xml|\+xml/.test(resp.headers['content-type'])) {
          parsedBody = libxml.parseXmlString(parsedBody);
        } else if (/\/json|\+json/.test(resp.headers['content-type'])) {
          parsedBody = JSON.parse(parsedBody);
        }
      } catch (exc) {
        return reject(exc);
      }
      resolve({
        code: resp.statusCode,
        headers: resp.headers,
        body: parsedBody
      });
    });
  });
};
