'use strict';

const _ = require(`lodash`);
const Joi = require(`joi`);
const express = require(`express`);
const libxml = require(`libxmljs`);
const bodyParser = require(`body-parser`);
const expect = require(`chai`).expect;

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
 * @param {Object} opt - option to configure loading
 * @param {Number} opt.port - absolute or relative path to read file
 * @param {String} opt.url - acceptable url to listen to
 * @param {String} opt.method = GET - acceptable Http method
 * @param {String|Object} opt.body = '' - response sent to incoming request
 * @param {Object} opt.headers = {} - response headers sent to incoming request
 * @param {Number} opt.code = 200 - status code sent to incoming request
 * @param {Object} opt._ctx = {} - internal context used for reporting
 * @return {Promise<String>} fulfilled with the option object modified with:
 * @return {String} body - body received (might be parsed in JSON/XML)
 * @return {Object} headers - request headers
 */
module.exports = opt => {
  Joi.assert(opt, schema);
  const method = opt.method || `GET`;
  opt._ctx = opt._ctx || {stack: []};
  opt._ctx.stack.push(`listen to ${method} ${opt.url}`);

  let response = opt.body;
  // response body default content type and serialization
  let defaults = {};
  if (response instanceof libxml.Document) {
    defaults = {'content-type': `application/xml`};
    response = response.toString(true);
  } else if (_.isObject(response)) {
    defaults = {'content-type': `application/json`};
  } else if (response) {
    defaults = {'content-type': `text/plain`};
  }

  const headers = _.assign({}, defaults, opt.headers || {});

  return new Promise((resolve, reject) => {
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
      res.status(opt.code || 200).set(headers).send(response);

      process.nextTick(() => {
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

          opt.body = body;
          opt.headers = req.headers;
          end(null, opt);
        } catch (exc) {
          end(exc);
        }
      });
    });

    server = app.listen(opt.port).on(`error`, end);
  });
};
