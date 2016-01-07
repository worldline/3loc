'use strict';

const Base = require(`./base`);
const chai = require(`chai`);
const Request = require(`./request`);
const express = require(`express`);
const bodyParser = require(`body-parser`);
const xmlUtils = require(`../utils/xml`);
const fileUtils = require(`../utils/file`);

const Joi = require(`joi`);
const number = Joi.number;
const string = Joi.string;
const object = Joi.object;
const expect = chai.expect;

chai.config.truncateThreshold = 0;

// chai.config.truncateThreshold = 0;

/**
 * Integration scenario that:
 * - launches a server
 * - performs an http request on a distant server
 * - awaits for a hit on the launched server
 * @class
 */
module.exports = class RequestAndListen extends Base {

  /**
   * @returns {Joi.object} Schema used to validate fixtures.
   * - {RequestSchema} req: Request class schema for outgoing first request
   * - {Object} lsn: schema for incoming second request
   * - {Number} lsn.port - local port on which the server will listen
   * - {String} lsn.url - expected request url
   * - {String} lsn.method - expected request protocol (default to 'GET')
   * - {String} lsn.resp - relative or absolute path to the response content (exclusive with respStr, default to empty)
   * - {String} lsn.respStr - response content (exclusive with resp, default to empty)
   * - {String} lsn.xsd - relative or absolute path to the XSD file used to validate request (exclusive with xsdStr)
   * - {String} lsn.xsdStr - XSD string used to validate request (exclusive with xsd)
   */
  static get schema() {
    return object().keys({
      req: Request.schema,
      lsn: object().keys({
        port: number().required(),
        // url: string().required(),
        // method: string().required().valid(`GET`, `POST`, `PUT`, `HEAD`, `DELETE`),
        resp: string(),
        respStr: string(),
        xsd: string(),
        xsdStr: string()
      }).unknown(true).
        nand(`resp`, `respStr`).
        nand(`xsd`, `xsdStr`)
    });
  }

  /**
   * - start a server
   * - sends an HTTP request
   * - validates its response
   * - awaits for a request on server and validates it
   * - sends a given response
   * @return {Promise} fullfilled with the received request's body
   */
  test() {
    let loadResp = this.fixtures.lsn.resp ? fileUtils.load(this.fixtures.lsn.resp) : Promise.resolve(this.fixtures.lsn.respStr);
    let loadXsd = this.fixtures.lsn.xsd ? fileUtils.load(this.fixtures.lsn.xsd) : Promise.resolve(this.fixtures.lsn.xsdStr);
    return loadResp.then(resp2 =>
      new Promise((resolve, reject) => {
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
          res.end(resp2);
          loadXsd.then(xmlUtils.compile).
            then(xsd => {
              // validates request
              expect(req.path).to.equals(this.fixtures.lsn.url);
              expect(req.method).to.equals(this.fixtures.lsn.method);
              return xmlUtils.validate(req.body, xsd);
            }).
            then(() => end(null)).
            catch(end);
        });

        server = app.listen(this.fixtures.lsn.port, () => {
          new Request(`${this.name} - request 1`, this.fixtures.req).
            run().
            catch(end);
        });
        server.on(`error`, end);
      })
    );
  }
};
