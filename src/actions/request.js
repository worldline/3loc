'use strict';

const request = require(`request`);
const _ = require(`lodash`);
const Joi = require(`joi`);
const libxml = require(`libxml-xsd`).libxmljs;
const logger = require(`../utils/logger`)(`act:request`);

// schema to enforce incoming options
const schema = Joi.object().keys({
  url: Joi.string().required().regex(/^https?:\/\//),
  method: Joi.string().valid(`GET`, `POST`, `PUT`, `HEAD`, `DELETE`),
  body: Joi.alternatives(Joi.string(), Joi.object(), Joi.func()),
  headers: Joi.object(),
  followRedirect: Joi.boolean()
});

/**
 * Makes an HTTP(s) request on a given url.
 * The HTTP method, the headers and the ability to follow redirections are configurable.
 *
 * If a JSON body is passed, set default request content-type to 'application/json'.
 * If a libXML.js Document body is pased, set default request content-type to 'application/xml'.
 * You can still override the request content-type if needed.
 *
 * Request body will be automatically parsed (using the request content-type) to libXML.js Document or to JSON object for further processing.
 * Otherwise, the request body is passed as a string.
 *
 * @example
 * request({
 *   url: 'http://localhost:8080/my-api',
 *   method: 'PUT',
 *   body: '{"msg": "request sent"}',
 *   headers: {
 *     'content-type': 'application/json',
 *     'x-custom': 'custom'
 *   },
 *   followRedirect: true
 * }).then(...)
 *
 * If you need to pass query parameters, please encode them with the url.
 *
 * If body is given as a function, it must return a promise fulfilled
 * with an object including a `content` property.
 *
 * @param {Object} opt - option to configure request
 * @param {String} opt.url - full url (protocol, host, port, path) requested
 * @param {String} opt.method = GET - method used
 * @param {String|Object|Document|Function} opt.body = '' - body sent (only when doing POST and PUT)
 * @param {Object} opt.headers = {} - request headers
 * @param {Boolean} opt.followRedirect = false - automatically follows redirection
 *
 * @return {Function} function usable in promises chain.
 * Takes as first parameter an object.
 * Returns a promise fulfilled with the same object, containing
 * - {String} content - response body received (might be parsed in JSON/XML)
 * - {Object} headers - response headers
 * - {Number} code - http status code
 */
module.exports = opt => {
  Joi.assert(opt, schema, `request action`);
  return args => {
    const method = opt.method || `GET`;

    args._ctx = args._ctx || {stack: []};
    args._ctx.stack.push(`request ${opt.url}`);
    // resolve body if provided as a promise
    return (_.isFunction(opt.body) ?
        Promise.resolve({}).then(opt.body) : Promise.resolve({content: opt.body})).
      then(result => {
        // request body default content type and serialization
        let body = result.content;
        let contentType = `text/plain`;
        if (body instanceof libxml.Document) {
          contentType = `application/xml`;
          body = body.toString(true);
        } else if (_.isObject(body)) {
          contentType = `application/json`;
          body = JSON.stringify(body);
        }
        return {body, contentType};
      }).
      then(content => new Promise((resolve, reject) => {
        // effectively performs Http(s) request
        logger.debug(`request ${method} ${opt.url}`);
        if (content.body) {
          logger.debug(`send body:\n${content.body}`);
        }
        request({
          method,
          url: opt.url,
          followRedirect: opt.followRedirect || false,
          headers: _.assign({}, {
            'content-type': content.contentType
          }, opt.headers || {}),
          body: content.body
        }, (err, resp, parsedBody) => {
          if (err) {
            return reject(err);
          }
          args.code = resp.statusCode;
          args.headers = resp.headers;

          logger.debug(`request ${method} ${opt.url} got status ${args.code}`);
          if (parsedBody) {
            logger.debug(`received body:\n${parsedBody}`);
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
          args.content = parsedBody;
          resolve(args);
        });
      })
    );
  };
};
