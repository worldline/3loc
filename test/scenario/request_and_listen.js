'use strict';

const expect = require(`chai`).expect;
const express = require(`express`);
const request = require(`request`);
const bodyParser = require(`body-parser`);
const fs = require(`fs`);
const path = require(`path`);
const RequestAndListen = require(`../../src/scenario/request_and_listen`);
const utils = require(`../utils/test-utils`);

describe(`Request & Listen Scenario`, () => {

  it(`should enforce fixtures`, () => {
    const name = `test`;
    // Some inherited fields
    expect(() => new RequestAndListen(name, {
      req: {
        url: `/`,
        code: 200
      }, lsn: {}
    })).to.throw(/"host" is required/);
    expect(() => new RequestAndListen(name, {
      req: {
        host: `http://toto`,
        url: `/`
      }, lsn: {}
    })).to.throw(/"code" is required/);

    // listening port
    expect(() => new RequestAndListen(name, {
      req: {
        host: `http://toto`,
        url: `/`,
        code: 200
      }, lsn: {
        url: `/`
      }
    })).to.throw(/"port" is required/);
    expect(() => new RequestAndListen(name, {
      req: {
        host: `http://toto`,
        url: `/`,
        code: 200
      }, lsn: {
        url: `/`,
        port: `coucou`
      }
    })).to.throw(/"port" must be a number/);

    // url
    expect(() => new RequestAndListen(name, {
      req: {
        host: `http://toto`,
        url: `/`,
        code: 200
      }, lsn: {
        port: 3000
      }
    })).to.throw(/"url" is required/);

    // method
    expect(() => new RequestAndListen(name, {
      req: {
        host: `http://toto`,
        url: `/`,
        code: 200
      }, lsn: {
        url: `/`,
        port: 3000,
        method: `TOTO`
      }
    })).to.throw(/"method" must be one of/);

    // resp and respStr
    expect(() => new RequestAndListen(name, {
      req: {
        host: `http://toto`,
        url: '/',
        code: 200
      }, lsn: {
        port: 3000,
        url: `/`,
        respStr: 'bonjour',
        resp: 'bonjour'
      }
    })).to.throw(/must not exist simultaneously/);

    // xsd and xsdStr
    expect(() => new RequestAndListen(name, {
      req: {
        host: `http://toto`,
        url: `/`,
        code: 200
      }, lsn: {
        port: 3000,
        url: `/`,
        xsdStr: 'bonjour',
        xsd: 'bonjour'
      }
    })).to.throw(/must not exist simultaneously/);
  });

  it(`should copy arbitrary keys to 'req' and 'lsn' fixtures`, done => {
    const scenario = new RequestAndListen(`name`, {
      req: {
        host: `http://toto`,
        url: `/`,
        code: 200,
        key2: `ko`
      }, lsn: {
        port: 3000,
        url: `/`
      }, key1: {
        a: 10,
        b: {
          value: [true]
        }
      }, key2: `ok`
    });

    expect(scenario.fixtures.req).to.deep.equals({
      host: 'http://toto',
      url: '/',
      code: 200,
      key1: {
        a: 10,
        b: {
          value: [true]
        }
      }, key2: `ok`
    });
    expect(scenario.fixtures.lsn).to.deep.equals({
      port: 3000,
      url: `/`,
      key1: {
        a: 10,
        b: {
          value: [true]
        }
      }, key2: `ok`
    });
    done();
  });

  describe(`given a running server`, () => {

    let app;
    let server;
    let inHost;
    let outPort;
    let conf;

    beforeEach(done => {
      app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.text({
        type: req => req.headers['content-type'].match(/text|xml$/)
      }));
      server = app.listen(() => {
        outPort = server.address().port;
        conf = {
          req: {
            host: `http://localhost:${outPort}`,
            url: `/req`,
            code: 200
          },
          lsn: {
            port: outPort + 1,
            method: `GET`,
            url: `/lsn`
          }
        };
        inHost = `http://localhost:${conf.lsn.port}${conf.lsn.url}`;
        done();
      });
      server.on(`error`, done);
    });

    afterEach(done => server.close(done));

    it(`should report listening server error`, done => {
      conf.lsn.port = outPort;
      new RequestAndListen(`test 1`, conf).
        run().
        catch(err => {
          expect(err).to.exist;
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.include(`EADDRINUSE`);
          done();
        }).
        catch(done);
    });

    it(`should report unexpected first request error`, done => {
      app.get(conf.req.url, (req, res) => {
        res.status(204).end();
      });

      new RequestAndListen(`unexpected status`, conf).
        run().
        catch(err => {
          expect(err).to.exist;
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.include(`204`);
          done();
        }).
        catch(done);
    });

    it(`should report received request XSD validation errors`, done => {
      conf.lsn.xsdStr = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="person">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="firstname" type="xs:string"/>
              <xs:element name="lastname" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:schema>`;

      app.get(conf.req.url, (req, res) => {
        res.end();
        request({
          method: conf.lsn.method,
          url: inHost,
          body: `<?xml version="1.0" encoding="UTF-8"?>
        <person>
          <toto>John</toto>
        </person>`
        }, err => expect(err).not.to.exist);
      });

      new RequestAndListen(`invalid 2nd XML request`, conf).run().
        catch(err => {
          expect(err).to.exist;
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.include(`element is not expected`);
          done();
        }).
        catch(done);
    });

    it(`should report unexpected request method`, done => {
      app.get(conf.req.url, (req, res) => {
        res.end();
        request({
          method: `POST`,
          url: inHost
        }, err => expect(err).not.to.exist);
      });

      new RequestAndListen(`unexpected method`, conf).run().
        catch(err => {
          expect(err).to.exist;
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.include(`expected 'POST' to equal 'GET'`);
          done();
        }).
        catch(done);
    });

    it(`should report unexpected request url`, done => {
      app.get(conf.req.url, (req, res) => {
        res.end();
        request({
          method: conf.lsn.method,
          url: `${inHost}/toto`
        }, err => expect(err).not.to.exist);
      });

      new RequestAndListen(`unexpected url`, conf).run().
        catch(err => {
          expect(err).to.exist;
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.include(`expected '/lsn/toto' to equal '/lsn'`);
          done();
        }).
        catch(done);
    });

    it(`should request a given url and awaits for another one`, done => {
      app.get(conf.req.url, (req, res) => {
        res.end();
        request({
          method: conf.lsn.method,
          url: inHost
        }, err => {
          expect(err).not.to.exist;
          done();
        });
      });

      new RequestAndListen(`ping pong`, conf).run().catch(done);
    });

    it(`should send expected response to request`, done => {
      conf.lsn.respStr = `Bonjour ${utils.randomInt()}`;

      app.get(conf.req.url, (req, res) => {
        res.end();
        request({
          method: conf.lsn.method,
          url: inHost
        }, (err, resp, body) => {
          expect(err).not.to.exist;
          expect(body).to.equals(conf.lsn.respStr);
          done();
        });
      });

      new RequestAndListen(`2nd req with response`, conf).run().catch(done);
    });

    it(`should send expected response from file to request`, done => {
      conf.lsn.resp = path.resolve(`test`, `fixtures`, `req2.txt`);
      fs.readFile(conf.lsn.resp, `utf8`, (err, content) => {
        expect(err).not.to.exist;

        app.get(conf.req.url, (req, res) => {
          res.end();
          request({
            method: conf.lsn.method,
            url: inHost
          }, (err2, response, body) => {
            expect(err2).not.to.exist;
            expect(body).to.equals(content);
            done();
          });
        });

        new RequestAndListen(`2nd req with response from file`, conf).run().catch(done);
      });
    });

    it(`validates received request against XSD`, done => {
      conf.lsn.xsdStr = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="person">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="firstname" type="xs:string"/>
              <xs:element name="lastname" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:schema>`;

      app.get(conf.req.url, (req, res) => {
        res.end();
        request({
          method: conf.lsn.method,
          url: inHost,
          body: `<?xml version="1.0" encoding="UTF-8"?>
        <person>
          <firstname>John</firstname>
          <lastname>Smith</lastname>
        </person>`
        }, err => {
          expect(err).not.to.exist;
          done();
        });
      });

      new RequestAndListen(`valid 2nd XML request`, conf).run().catch(done);
    });

    it(`should validates received request against XSD from file`, done => {
      conf.lsn.xsd = path.resolve(`test`, `fixtures`, `person.xsd`);

      app.get(conf.req.url, (req, res) => {
        res.end();
        request({
          method: conf.lsn.method,
          url: inHost,
          body: `<?xml version="1.0" encoding="UTF-8"?>
        <person>
          <firstname>John</firstname>
          <lastname>Smith</lastname>
        </person>`
        }, err => {
          expect(err).not.to.exist;
          done();
        });
      });

      new RequestAndListen(`valid 2nd XML request`, conf).run().catch(done);
    });

  });

});
