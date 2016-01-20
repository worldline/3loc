'use strict';

const expect = require(`chai`).expect;
const path = require(`path`);
const shutdownLoggers = require(`../utils/test-utils`).shutdownLoggers;
const run = require(`../../src/actions/run`);

describe(`Run action`, () => {

  shutdownLoggers(`act:run`);

  it(`should enforce fixtures`, () => {
    // function
    expect(() => run()).to.throw(/"value" is required/);
    expect(() => run({})).to.throw(/must be a Function/);

    // data
    expect(() => run(() => {}, true)).to.throw(/must be an object/);
  });

  it(`should wrap a function into a promise with empty parameters`, () => {
    return run(params => params).then(params => expect(params).to.be.empty);
  });

  it(`should wrap a function give it parameters`, () => {
    const params = {something: `yeah`};
    return run(p => p, params).then(p => expect(p).to.deep.equals(params));
  });
});
