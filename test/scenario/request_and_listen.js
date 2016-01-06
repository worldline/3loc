'use strict';

const expect = require(`chai`).expect;
const express = require(`express`);
const request = require(`request`);
const RequestAndListen = require(`../../src/scenario/request_and_listen`);

describe(`Request & Listen Scenario`, () => {

  it(`should enforce fixtures`, () => {
    const name = `test`;
    expect(() => new RequestAndListen(name, {
      url: '/',
      code: 200
    })).to.throw(/"host" is required/);

    expect(() => new RequestAndListen(name, {
      host: 'http://toto',
      url: '/'
    })).to.throw(/"code" is required/);

    expect(() => new RequestAndListen(name, {
      host: 'http://toto',
      code: 200
    })).to.throw(/"url" is required/);

    expect(() => new RequestAndListen(name, {
      host: 'ya!',
      code: 200
    })).to.throw(/fails to match/);

    expect(() => new RequestAndListen(name, {
      host: `http://toto`,
      url: `/`,
      code: 200
    })).to.throw(/"listeningPort" is required/);
  });

  describe(`given a running server`, () => {

    let app;
    let server;
    let port;
    let url = `/`;
    let host;
    let listeningPort;
    let backHost;

    beforeEach(done => {
      app = express();
      server = app.listen(() => {
        port = server.address().port;
        host = `http://localhost:${port}`;
        listeningPort = port + 1;
        backHost = `http://localhost:${listeningPort}`;
        done();
      });
      server.on(`error`, done);
    });

    afterEach(done => server.close(done));

    it(`should request a given url and awaits for another one`, done => {
      app.get(url, (req, res) => {
        // TODO validate request
        res.end();
        // sends a request
        request({
          method: `GET`,
          url: backHost
        }, err => {
          if (err) {
            return done(err);
          }
          // TODO validate response
          done();
        });
      });

      new RequestAndListen(`test 1`, {
        host,
        url,
        code: 200,
        listeningPort
      }).run().catch(done);
    });

    it(`should report unexpected first request error`, done => {
      app.get(url, (req, res) => {
        res.status(204).end();
      });

      new RequestAndListen(`test 1`, {
        host,
        url,
        code: 200,
        listeningPort
      }).
        run().
        catch(err => {
          expect(err).to.exist;
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.include(`204`);
          done();
        }).
        catch(done);
    });

    it(`should report listening server error`, done => {

      new RequestAndListen(`test 1`, {
        host,
        url,
        code: 200,
        listeningPort: port
      }).
        run().
        catch(err => {
          expect(err).to.exist;
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.include(`EADDRINUSE`);
          done();
        }).
        catch(done);
    });

  });

});
