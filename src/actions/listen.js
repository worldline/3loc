'use strict';

const _ = require(`lodash`);
const Joi = require(`joi`);
const express = require(`express`);
const libxml = require(`libxmljs`);
const bodyParser = require(`body-parser`);
const expect = require(`chai`).expect;
const makePromisable = require(`../utils/object`).makePromisable;

// schema to enforce incoming options
const schema = Joi.object().keys({
  port: Joi.number().required(),
  url: Joi.string().required().regex(/^\//),
  method: Joi.string().valid(`GET`, `POST`, `PUT`, `HEAD`, `DELETE`),
  body: Joi.alternatives(Joi.string(), Joi.object()),
  headers: Joi.object(),
  code: Joi.number()
});

// TODO timeout

/**
 * Starts an http server to listen a given url.
 * Acceptable method can be configured, has well as response body and headers.
 *
 * If a JSON body is passed, set default response content-type to 'application/json'.
 * If a libXML.js Document body is pased, set default response content-type to 'application/xml'.
 * They are still overridable.
 *
 * If body is given as a promise, the expected fulfilled value must include
 * a `content` property.
 *
 * @param {Object} opt - option to configure loading
 * @param {Number} opt.port - absolute or relative path to read file
 * @param {String} opt.url - acceptable url to listen to
 * @param {String} opt.method = GET - acceptable Http method
 * @param {String|Object|Document|Promise} opt.body = '' - response sent to incoming request
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

  return makePromisable(args => {
    args._ctx = args._ctx || {stack: []};
    args._ctx.stack.push(`listen to ${method} ${opt.url}`);

    // resolve body if provided as a promise
    return (_.isObject(opt.body) && _.isFunction(opt.body.then) ?
        opt.body : Promise.resolve({content: opt.body})).
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
          // sends response to avoid socket hang-up
          res.status(opt.code || 200).set(headers).send(content.response);

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
              end(null, args);
            } catch (exc) {
              end(exc);
            }
          }, 2);
        });

        server = app.listen(opt.port).on(`error`, end);
      }));
  });
};
