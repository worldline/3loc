'use strict';

const _ = require(`lodash`);
const Joi = require(`joi`);
const express = require(`express`);
const libxml = require(`libxml-xsd`).libxmljs;
const bodyParser = require(`body-parser`);
const expect = require(`chai`).expect;
const logger = require(`../utils/logger`)(`act:listen`);

// schema to enforce incoming options
const schema = Joi.object().keys({
  port: Joi.number().required(),
  url: Joi.string().required().regex(/^\//),
  method: Joi.string().valid(`GET`, `POST`, `PUT`, `HEAD`, `DELETE`),
  body: Joi.alternatives(Joi.string(), Joi.object(), Joi.func()),
  headers: Joi.object(),
  code: Joi.number()
});

// TODO timeout

/**
 * Starts an HTTP server to listen a given url.
 * Acceptable method can be configured, has well as response body and headers.
 *
 * If a JSON body is passed, set default response content-type to 'application/json'.
 * If a libXML.js Document body is pased, set default response content-type to 'application/xml'.
 * You can still override the response content-type if needed.
 *
 * If body is given as a function, it must return a promise fulfilled
 * with an object including a `content` property.
 *
 * Request body will be automatically parsed (using the request content-type) to libXML.js Document or to JSON object for further processing.
 * Otherwise, the request body is passed as a string.
 *
 * @example
 * listen({
 *   port: 4000,
 *   url: '/my-api',
 *   method: 'POST',
 *   body: '{"msg": "response sent"}',
 *   headers: {
 *     'content-type': 'application/json',
 *     'x-custom': 'custom'
 *   },
 *   code: 200
 * }).then(...)
 *
 * @param {Object} opt - option to configure listening
 * @param {Number} opt.port - absolute or relative path to read file
 * @param {String} opt.url - acceptable url to listen to
 * @param {String} opt.method = GET - acceptable Http method
 * @param {String|Object|Document|Function} opt.body = '' - response sent to incoming request
 * @param {Object} opt.headers = {} - response headers sent to incoming request
 * @param {Number} opt.code = 200 - status code sent to incoming request
 *
 * @return {Function} function usable in promises chain.
 * Takes as first parameter an object.
 * Returns a promise fulfilled with the same object, containing
 * - {String} content - response body received (might be parsed in JSON/XML)
 * - {Object} headers - response headers
 */
module.exports = opt => {
  Joi.assert(opt, schema, `listen action`);
  const method = opt.method || `GET`;

  return args => {
    args._ctx = args._ctx || {stack: []};
    args._ctx.stack.push(`listen to ${method} ${opt.url}`);

    // resolve body if provided as a promise
    return (_.isFunction(opt.body) ?
        Promise.resolve({}).then(opt.body) : Promise.resolve({content: opt.body})).
      then(result => {
      // request body default content type and serialization
        let response = result.content;
        let defaults = {};
        if (response instanceof libxml.Document) {
          defaults = {'content-type': `application/xml`};
          response = response.toString(true);
        } else if (_.isObject(response)) {
          defaults = {'content-type': `application/json`};
          response = JSON.stringify(response);
        } else if (response) {
          defaults = {'content-type': `text/plain`};
        }
        return {response, defaults};
      }).
      then(content => new Promise((resolve, reject) => {
        const headers = _.assign({}, content.defaults, opt.headers || {});
        const app = express();
        let server;

        // clean ending with server termination
        const end = (err, result) => {
          server.close();
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        };

        // parse every incoming request as text
        app.use(bodyParser.text({type: () => true}));

        app.use((req, res) => {
          const code = opt.code || 200;
          logger.debug(`listen to ${method} ${opt.url} got request and send ${code}`);
          if (content.response) {
            logger.debug(`send response:\n${content.response}`);
          }
          // sends response to avoid socket hang-up
          res.status(code).set(headers).send(content.response);

          // use a long enought timeout to allow response to be received
          setTimeout(() => {
            try {
              // validates request
              expect(req.path, 'Unexpected url').to.equals(opt.url);
              expect(req.method, 'Unexpected method').to.equals(method);

              // body parsing
              let body = req.body;
              if (/\/xml|\+xml/.test(req.headers['content-type'])) {
                body = libxml.parseXmlString(body);
              } else if (/\/json|\+json/.test(req.headers['content-type'])) {
                body = JSON.parse(body);
              }

              args.content = body;
              args.headers = req.headers;
              if (args.content) {
                logger.debug(`listen to ${method} ${opt.url} got body:\n${args.content}`);
              }
              end(null, args);
            } catch (exc) {
              end(exc);
            }
          }, 2);
        });

        server = app.listen(opt.port).on(`error`, end);
        logger.debug(`listen to ${method} ${opt.url}`);
      }));
  };
};
