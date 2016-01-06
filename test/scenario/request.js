'use strict';

const expect = require(`chai`).expect;
const express = require(`express`);
const Request = require(`../../src/scenario/request`);

describe(`Request Scenario`, () => {

  let url = `/`;

  it(`should enforce fixtures`, () => {
    const name = `test`;
    expect(() => new Request(name, {
      url: '/',
      code: 200
    })).to.throw(/"host" is required/);

    expect(() => new Request(name, {
      host: 'http://toto',
      url: '/'
    })).to.throw(/"code" is required/);

    expect(() => new Request(name, {
      host: 'http://toto',
      code: 200
    })).to.throw(/"url" is required/);

    expect(() => new Request(name, {
      host: 'ya!',
      code: 200
    })).to.throw(/fails to match/);
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
      server = app.listen(() => {
        host = `http://localhost:${server.address().port}`;
        done();
      });
      server.on(`error`, done);
    });

    afterEach(done => server.close(done));

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
