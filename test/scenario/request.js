'use strict';

const expect = require(`chai`).expect;
const Request = require(`../../src/scenario/request`);

describe(`Request Scenario`, () => {

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

  it.skip(`should request a given url and enforce response`, done => {
    done(`unimplemented yet`);
  });

});
