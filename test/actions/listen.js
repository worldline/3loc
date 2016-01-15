'use strict';

const http = require(`http`);
const expect = require(`chai`).expect;
const request = require(`request`);
const libxml = require(`libxmljs`);
const listen = require(`../../src/actions/listen`);

/**
 * Get a free port for listening
 * @return {Promise<Number>} fulfilled with a free port.
 */
const getFreePort = () => new Promise(resolve => {
  const server = http.createServer();
  server.listen(() => {
    const port = server.address().port;
    server.close();
    resolve(port);
  });
});

describe(`Http listening action`, () => {

  it(`should enforce fixtures`, () => {
    // port
    expect(() => listen({
    })).to.throw(/"port" is required/);
    expect(() => listen({
      port: `toto`
    })).to.throw(/must be a number/);

    // url
    expect(() => listen({
      port: 2000
    })).to.throw(/"url" is required/);
    expect(() => listen({
      port: 2000,
      url: `toto`
    })).to.throw(/fails to match/);

    // method
    expect(() => listen({
      port: 2000,
      url: `/`,
      method: `toto`
    })).to.throw(/must be one of/);

    // body
    expect(() => listen({
      port: 2000,
      url: `/`,
      body: true
    })).to.throw(/must be a string/);

    // headers
    expect(() => listen({
      port: 2000,
      url: `/`,
      headers: true
    })).to.throw(/must be an object/);

    // code
    expect(() => listen({
      port: 2000,
      url: `/`,
      code: true
    })).to.throw(/must be a number/);
  });

  it(`should report server start errors`, done => {
    // given a started server
    const server = http.createServer();
    server.listen(() => {
      listen({port: server.address().port, url: `/`}).
        then(() => {
          server.close();
          done(`should have failed !`);
        }).
        catch(err => {
          server.close();
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.include(`EADDRINUSE`);

          done();
        }).catch(done);
    });
  });

  it(`should report server start errors`, done => {
    // given a started server
    const server = http.createServer();
    server.listen(() => {
      listen({port: server.address().port, url: `/`}).
        then(() => {
          server.close();
          done(`should have failed !`);
        }).
        catch(err => {
          server.close();
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.include(`EADDRINUSE`);

          done();
        }).catch(done);
    });
  });

  describe(`given a free port`, () => {
    let port;

    before(done => {
      getFreePort().
        then(p => {
          port = p;
          done();
        }).
        catch(done);
    });

    it(`should report unexpected request method`, done => {
      const server = listen({port, url: `/`});

      request({
        method: `POST`,
        url: `http://localhost:${port}/`
      }, err => {
        expect(err).not.to.exist;
        server.
          then(() => done(`should have failed !`)).
          catch(err2 => {
            expect(err2).to.be.an.instanceOf(Error);
            expect(err2.message).to.include(`expected 'POST' to equal 'GET'`);
            done();
          }).catch(done);
      });
    });

    it(`should report unexpected url`, done => {
      const server = listen({port, url: `/`, method: `POST`});

      request({
        method: `POST`,
        url: `http://localhost:${port}/toto`
      }, err => {
        expect(err).not.to.exist;
        server.
          then(() => done(`should have failed !`)).
          catch(err2 => {
            expect(err2).to.be.an.instanceOf(Error);
            expect(err2.message).to.include(`Unexpected url: expected '/toto' to equal '/'`);
            done();
          }).catch(done);
      });
    });

    it(`should send response headers`, done => {
      const server = listen({port, url: `/`, headers: {'x-custom': `yeah !`}});

      request({
        url: `http://localhost:${port}/`
      }, (err, res) => {
        expect(err).not.to.exist;
        expect(res).to.have.deep.property(`headers.x-custom`).that.equals(`yeah !`);
        server.then(result => {
          expect(result).to.have.property(`body`).that.is.empty;
          expect(result).to.have.property(`headers`).that.is.an(`object`);
          done();
        }).catch(done);
      });
    });

    it(`should send response status code`, done => {
      const code = 204;
      listen({port, url: `/`, code}).
        then(result => {
          expect(result).to.have.property(`body`).that.is.empty;
          expect(result).to.have.property(`headers`).that.is.an(`object`);
          done();
        }).catch(done);

      request({
        url: `http://localhost:${port}/`
      }, (err, res) => {
        expect(err).not.to.exist;
        expect(res).to.have.property(`statusCode`).that.equals(code);
      });
    });

    it(`should send text response`, done => {
      const body = `Hi there !`;
      const server = listen({port, url: `/`, body});

      request({
        url: `http://localhost:${port}/`
      }, (err, res, reqBody) => {
        expect(err).not.to.exist;
        expect(res).to.have.deep.property(`headers.content-type`).that.includes(`text/plain`);
        expect(reqBody).to.equal(body);
        server.then(result => {
          expect(result).to.have.property(`body`).that.is.empty;
          expect(result).to.have.property(`headers`).that.is.an(`object`);
          done();
        }).catch(done);
      });
    });

    it(`should send Json response`, done => {
      const body = {message: `hello`};
      const server = listen({port, url: `/`, body});

      request({
        url: `http://localhost:${port}/`
      }, (err, res, reqBody) => {
        expect(err).not.to.exist;
        expect(res).to.have.deep.property(`headers.content-type`).that.includes(`application/json`);
        expect(reqBody).to.equals(JSON.stringify(body));
        server.then(result => {
          expect(result).to.have.property(`body`).that.is.empty;
          expect(result).to.have.property(`headers`).that.is.an(`object`);
          done();
        }).catch(done);
      });
    });

    it(`should send Xml response`, done => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<msg>Hola</msg>\n`;
      const server = listen({port, url: `/`, body: libxml.parseXmlString(xml)});

      request({
        url: `http://localhost:${port}/`
      }, (err, res, reqBody) => {
        expect(err).not.to.exist;
        expect(res).to.have.deep.property(`headers.content-type`).that.includes(`application/xml`);
        expect(reqBody).to.equals(xml);
        server.then(result => {
          expect(result).to.have.property(`body`).that.is.empty;
          expect(result).to.have.property(`headers`).that.is.an(`object`);
          done();
        }).catch(done);
      });
    });

    it(`should parse Json body`, done => {
      const body = {message: `hello`};
      const method = `POST`;
      const server = listen({port, url: `/`, method});

      request({
        url: `http://localhost:${port}/`,
        method,
        headers: {'content-type': `application/json`},
        body: JSON.stringify(body)
      }, err => {
        expect(err).not.to.exist;
        server.then(result => {
          expect(result).to.deep.have.property(`headers.content-type`).that.equals(`application/json`);
          expect(result).to.have.property(`body`).that.deep.equals(body);
          done();
        }).catch(done);
      });
    });

    it(`should parse Xml request body`, done => {
      const body = `<msg>Hola</msg>`;
      const method = `POST`;
      const server = listen({port, url: `/`, method});

      request({
        url: `http://localhost:${port}/`,
        method,
        headers: {'content-type': `application/xml`},
        body
      }, err => {
        expect(err).not.to.exist;
        server.then(result => {
          expect(result).to.deep.have.property(`headers.content-type`).that.equals(`application/xml`);
          expect(result).to.have.property(`body`).that.deep.equals(libxml.parseXmlString(body));
          done();
        }).catch(done);
      });
    });

    it(`should propagate context`, () => {
      let server = listen({port, url: `/`});

      request(`http://localhost:${port}/`, err => {
        expect(err).not.to.exist;

        server.then(result => {
          expect(result).to.have.deep.property(`_ctx.stack`).that.has.length(1);
          expect(result._ctx.stack[0]).to.equals(`listen to GET /`);

          result.method = `POST`;
          result.url = `/toto`;
          server = listen(result);

          request.post(`http://localhost:${port}/toto`, err2 => {
            expect(err2).not.to.exist;

            server.then(res => {
              expect(res).to.have.deep.property(`_ctx.stack`).that.has.length(2);
              expect(res._ctx.stack[1]).to.equals(`listen to POST /toto`);
              done();
            });
          });
        }).catch(done);
      });
    });
  });

});
