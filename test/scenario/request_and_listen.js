'use strict';

const expect = require(`chai`).expect;
const Hapi = require(`hapi`);
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

  describe.only(`given a running server`, () => {

    let server;
    let port;
    let url = `/`;
    let host;
    let listeningPort;
    let backHost;

    beforeEach(done => {
      server = new Hapi.Server();
      server.connection({port: 0});
      server.start(err => {
        port = server.info.port;
        host = `http://localhost:${port}`;
        listeningPort = port + 1;
        backHost = `http://localhost:${listeningPort}`;
        done(err);
      });
    });

    afterEach(done => server.stop(done));

    it.skip(`should request a given url and awaits for another one`, () => {
      server.route({
        method: `GET`,
        path: url,
        handler: (req, reply) => {
          // TODO validate request
          reply();
          // sends a request
          request({
            method: `GET`,
            url: backHost
          }, err => {
            if (err) {
              return done(err);
            }
            // TODO validate response
          });
        }
      });

      return new RequestAndListen(`test 1`, {
        host,
        url,
        code: 200,
        listeningPort
      }).run();
    });


    it(`should report unexpected first request code`, done => {
      server.route({
        method: `GET`,
        path: url,
        handler: (req, reply) => {
          reply().statusCode = 204;
        }
      });

      new RequestAndListen(`test 1`, {
        host,
        url,
        code: 200,
        listeningPort
      }).run().then(() => {
        done(`should have failed`);
      }).catch(err => {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`204`);
        done();
      });
    });

  });

});
