'use strict';

const expect = require(`chai`).expect;
const express = require(`express`);
const bodyParser = require(`body-parser`);
const fs = require(`fs`);
const path = require(`path`);
const Request = require(`../../src/scenario/request`);

describe(`Request Scenario`, () => {

  let url = `/`;

  it(`should enforce fixtures`, () => {
    const name = `test`;

    // host
    expect(() => new Request(name, {
      url: '/',
      code: 200
    })).to.throw(/"host" is required/);
    expect(() => new Request(name, {
      host: 'ya!',
      url: '/',
      code: 200
    })).to.throw(/fails to match/);

    // status code
    expect(() => new Request(name, {
      host: 'http://toto',
      url: '/'
    })).to.throw(/"code" is required/);

    // url
    expect(() => new Request(name, {
      host: 'http://toto',
      code: 200
    })).to.throw(/"url" is required/);

    // body & bodyStr
    expect(() => new Request(name, {
      host: 'http://toto',
      url: '/',
      code: 200,
      bodyStr: 'bonjour',
      body: 'bonjour'
    })).to.throw(/must not exist simultaneously/);

    // method
    expect(() => new Request(name, {
      host: 'http://toto',
      url: '/',
      code: 200,
      method: 'unknown'
    })).to.throw(/must be one of/);
  });

  it(`should report unreachable errors`, done => {
    new Request(`unexpected status`, {
      host: `http://localhost;1234`,
      url,
      code: 200
    }).run().
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

    beforeEach(done => {
      app = express();
      app.use(bodyParser.json());
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

    it(`should request with a given body string as text`, done => {
      const bodyStr = `bonjour`;

      app.post(url, (req, res) => {
        res.end();
        process.nextTick(() => {
          expect(req.headers).to.have.property(`content-type`).that.equals(`text/plain`);
          expect(req.body).to.equals(bodyStr);
          done();
        });
      });

      new Request(`POST plain text`, {
        host,
        url,
        code: 200,
        method: `POST`,
        bodyStr
      }).run().catch(done);
    });

    it(`should request with a given body string as JSON`, done => {
      const bodyStr = `{"content": "bonjour"}`;

      app.post(url, (req, res) => {
        res.end();
        process.nextTick(() => {
          expect(req.headers).to.have.property(`content-type`).that.equals(`application/json`);
          expect(req.body).to.deep.equals(JSON.parse(bodyStr));
          done();
        });
      });

      new Request(`POST JSON`, {
        host,
        url,
        code: 200,
        method: `POST`,
        contentType: `application/json`,
        bodyStr
      }).run().catch(done);
    });

    it(`should request with a given body file as XML`, done => {
      const body = path.resolve(`test`, `fixtures`, `req1.xml`);
      fs.readFile(body, `utf8`, (err, content) => {
        if (err) {
          return done(err);
        }

        app.put(url, (req, res) => {
          res.end();
          process.nextTick(() => {
            expect(req.headers).to.have.property(`content-type`).that.equals(`application/xml`);
            expect(req.body).to.equals(content);
            done();
          });
        });

        new Request(`PUT XML`, {
          host,
          url,
          code: 200,
          method: `PUT`,
          contentType: `application/xml`,
          body
        }).run().catch(done);
      });
    });

    it(`should request with a given body file as text`, done => {
      const body = path.resolve(`test`, `fixtures`, `req2.txt`);
      fs.readFile(body, `utf8`, (err, content) => {
        if (err) {
          return done(err);
        }

        app.post(url, (req, res) => {
          res.end();
          process.nextTick(() => {
            expect(req.headers).to.have.property(`content-type`).that.equals(`text/plain`);
            expect(req.body).to.equals(content);
            done();
          });
        });

        new Request(`POST plain text file`, {
          host,
          url,
          code: 200,
          method: `POST`,
          body
        }).run().catch(done);
      });
    });

    it(`should set request's HTTP method`, () => {

      app.put(url, (req, res) => {
        res.end();
      });

      return new Request(`empty PUT`, {
        host,
        url,
        code: 200,
        method: `PUT`
      }).run();
    });

    it(`should request a given url and enforce response`, () => {
      app.get(url, (req, res) => {
        // empty response
        res.end();
      });

      return new Request(`no content`, {
        host,
        url,
        code: 200
      }).run();
    });

    it(`should report missing body file`, done => {
      new Request(`misisng file`, {
        host,
        url,
        code: 200,
        body: `unknown`
      }).run().
        catch(err => {
          expect(err).to.exist;
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.include(`ENOENT`);
          done();
        }).
        catch(done);
    });

    it(`should report unexpected request error`, done => {
      app.get(url, (req, res) => {
        // return unexpected status
        res.status(400).end();
      });

      new Request(`unexpected status`, {
        host,
        url,
        code: 200
      }).run().
        catch(err => {
          expect(err).to.exist;
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.include(`400`);
          done();
        }).
        catch(done);
    });
  });

});