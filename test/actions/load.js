'use strict';

const expect = require(`chai`).expect;
const path = require(`path`);
const load = require(`../../src/actions/load`);

describe(`File loading action`, () => {

  it(`should enforce fixtures`, () => {
    // path
    expect(() => load({
    })).to.throw(/"path" is required/);

    expect(() => load({
      path: true
    })).to.throw(/must be a string/);

    // encoding
    expect(() => load({
      path: `.`,
      encoding: `toto`
    })).to.throw(/must be one of/);
  });

  it(`should report unexisting file`, done => {
    load({path: 'unknown'}).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.include(`ENOENT`);
        done();
      }).catch(done);
  });

  it(`should read file content`, () => {
    return load({path: path.resolve(__dirname, `..`, `fixtures`, `req2.txt`)}).
      then(result => expect(result).to.have.property(`content`).that.equals(`bonjour !`));
  });

  it(`should encoding be specified file content`, () => {
    return load({
      path: path.resolve(__dirname, `..`, `fixtures`, `req2.txt`),
      encoding: `base64`
    }).
      then(result => {
        expect(result).to.have.property(`content`).that.equals(new Buffer(`bonjour !`).toString(`base64`));
      });
  });
});
