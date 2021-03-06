'use strict';

const expect = require(`chai`).expect;
const express = require(`express`);
const bodyParser = require(`body-parser`);
const libxml = require(`libxml-xsd`).libxmljs;
const run = require(`../utils/test-utils`).run;
const shutdownLoggers = require(`../utils/test-utils`).shutdownLoggers;
const request = require(`../../src/actions/request`);

describe(`Http request action`, () => {

  shutdownLoggers(`act:request`);

  it(`should enforce fixtures`, () => {
    // url
    expect(() => request({})).to.throw(/"url" is required/);

    expect(() => request({
      url: 'ya!'
    })).to.throw(/fails to match/);

    // method
    expect(() => request({
      url: 'http://toto',
      method: 'unknown'
    })).to.throw(/must be one of/);
  });

  it(`should report unreachable errors`, done => {
    run(request({url: `http://localhost:1234/toto`})).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`ECONNREFUSED`);
        done();
      }).
      catch(done);
  });

  describe(`given a running server`, () => {

    let app;
    let server;
    let host;
    const url = '/my-api';

    beforeEach(done => {
      app = express();
      app.use(bodyParser.json({
        type: `*/json`
      }));
      app.use(bodyParser.text({
        type: req => req.headers['content-type'].match(/text|xml$/)
      }));
      server = app.listen(() => {
        host = `http://localhost:${server.address().port}`;
        done();
      });
      server.on(`error`, done);
    });

    afterEach(done => server.close(done));

    it(`should return status, headers and content`, () => {
      app.get(url, (req, res) => {
        // return unexpected status
        res.append(`x-custom`, 124).
          status(200).
          end(`Good !`);
      });

      return run(request({url: `${host}${url}`})).
        then(result => {
          expect(result).to.be.an('object');
          expect(result).to.have.property(`code`).that.equals(200);
          expect(result).to.have.property(`content`).that.equals(`Good !`);
          expect(result).to.have.deep.property(`headers.x-custom`).that.equals(`124`);
          expect(result).to.have.deep.property(`headers.x-powered-by`).that.equals(`Express`);
        });
    });

    it(`should set request's HTTP method`, () => {
      app.put(url, (req, res) => {
        res.end(`ok`);
      });

      return run(request({
        method: `PUT`,
        url: `${host}${url}`
      })).
        then(result => expect(result.content).to.equals(`ok`));
    });

    it(`should set request's headers`, () => {
      app.get(url, (req, res) => {
        expect(req.headers).to.have.property(`content-type`).that.equals(`text/plain`);
        expect(req.headers).to.have.property(`x-custom`).that.equals(`yeah !`);
        res.end(`ok !`);
      });

      return run(request({
        url: `${host}${url}`,
        headers: {
          'x-custom': `yeah !`
        }
      })).
        then(result => expect(result.content).to.equals(`ok !`));
    });

    it(`should send a text plain body`, done => {
      const body = `bonjour`;

      app.post(url, (req, res) => {
        res.end();
        process.nextTick(() => {
          expect(req.headers).to.have.property(`content-type`).that.equals(`text/plain`);
          expect(req.body).to.equals(body);
          done();
        });
      });

      run(request({
        url: `${host}${url}`,
        method: `POST`,
        body
      })).catch(done);
    });

    it(`should accept body from a function`, done => {
      const body = `bonjour`;

      app.post(url, (req, res) => {
        res.end();
        process.nextTick(() => {
          expect(req.headers).to.have.property(`content-type`).that.equals(`text/plain`);
          expect(req.body).to.equals(body);
          done();
        });
      });

      run(request({
        url: `${host}${url}`,
        method: `POST`,
        body: () => {
          return {content: body};
        }
      })).catch(done);
    });

    it(`should send a Json body`, done => {
      const body = {content: `bonjour`};

      app.post(url, (req, res) => {
        res.end();
        process.nextTick(() => {
          expect(req.headers).to.have.property(`content-type`).that.equals(`application/json`);
          expect(req.body).to.deep.equals(body);
          done();
        });
      });

      run(request({
        url: `${host}${url}`,
        method: `POST`,
        body
      })).catch(done);
    });

    it(`should send a Xml body`, done => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <firstname>John</firstname>
  <lastname>Smith</lastname>
</person>
`;

      app.post(url, (req, res) => {
        res.end();
        process.nextTick(() => {
          expect(req.headers).to.have.property(`content-type`).that.equals(`application/xml`);
          expect(req.body).to.deep.equals(xml);
          done();
        });
      });

      run(request({
        url: `${host}${url}`,
        method: `POST`,
        body: libxml.parseXmlString(xml)
      })).catch(done);
    });

    it(`should parse Json response`, () => {
      const response = {content: `bonjour`};

      app.get(url, (req, res) => {
        res.json(response);
      });

      run(request({
        url: `${host}${url}`
      })).
      then(result => {
        expect(result.headers).to.have.property(`content-type`).that.includes(`application/json`);
        expect(result.content).to.deep.equals(response);
      });
    });

    it(`should report Json response parsing error`, done => {
      app.get(url, (req, res) => {
        res.set(`Content-type`, `application/json`).send(`{"content":"toto`);
      });

      run(request({
        url: `${host}${url}`
      })).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`Unexpected end of inpu`);
        done();
      }).catch(done);
    });

    it(`should override default content-type`, done => {
      const body = {content: `bonjour`};

      app.get(url, (req, res) => {
        res.end();
        process.nextTick(() => {
          expect(req.headers).to.have.property(`content-type`).that.equals(`text/json`);
          expect(req.body).to.deep.equals(body);
          done();
        });
      });

      return run(request({
        url: `${host}${url}`,
        headers: {
          'content-type': 'text/json'
        },
        body
      })).catch(done);
    });

    it(`should parse Xml response`, () => {
      const response = `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <firstname>John</firstname>
  <lastname>Smith</lastname>
</person>
`;

      app.get(url, (req, res) => {
        res.set('Content-Type', 'application/xml').send(response);
      });

      return run(request({
        url: `${host}${url}`
      })).
        then(result => {
          expect(result.headers).to.have.property(`content-type`).that.includes(`application/xml`);
          expect(result.content).to.deep.equals(libxml.parseXmlString(response));
        });
    });

    it(`should report Xml response parsing error`, done => {
      app.get(url, (req, res) => {
        res.set(`Content-type`, `application/xml`).send(`<msg>Toto</ms`);
      });

      run(request({
        url: `${host}${url}`
      })).
        then(() => done(`should have failed !`)).
        catch(err => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.include(`Opening and ending tag mismatch`);
          done();
        }).catch(done);
    });

    it(`should parse Json response`, () => {
      const response = {content: `bonjour`};

      app.get(url, (req, res) => {
        res.json(response);
      });

      return run(request({
        url: `${host}${url}`
      })).
        then(result => {
          expect(result.headers).to.have.property(`content-type`).that.includes(`application/json`);
          expect(result.content).to.deep.equals(response);
        });
    });

    it(`should propagate context`, () => {
      const url2 = `/second`;

      app.get(url2, (req, res) => {
        res.end();
      });
      app.get(url, (req, res) => {
        res.end();
      });

      return run(request({
        url: `${host}${url}`
      })).
        then(result => {
          expect(result).to.have.deep.property(`_ctx.stack`).that.has.length(1);
          expect(result._ctx.stack[0]).to.equals(`request ${host}${url}`);
          return result;
        }).
        then(request({
          url: `${host}${url2}`
        })).
        then(result => {
          expect(result).to.have.deep.property(`_ctx.stack`).that.has.length(2);
          expect(result._ctx.stack[1]).to.equals(`request ${host}${url2}`);
        });
    });
  });
});
