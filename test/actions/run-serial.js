'use strict';

const expect = require(`chai`).expect;
const runSerial = require(`../../src/actions/run-serial`);

describe(`Run serial action`, () => {

  it(`should run function actions`, () => {
    let earlyStart = true;
    const action1 = param => {
      expect(earlyStart).to.be.false;
      expect(param).not.to.be.defined;
      return 1;
    };
    const action2 = param => {
      expect(param).to.equals(1);
      return 2;
    };
    return Promise.resolve({}).
      then(() => earlyStart = false).
      then(runSerial([action1, action2])).
      then(result => expect(result).to.equal(2));
  });

  it(`should run a single actions`, () => {
    let earlyStart = true;
    const action1 = param => {
      expect(earlyStart).to.be.false;
      expect(param).not.to.be.defined;
      return 1;
    };
    return Promise.resolve({}).
      then(() => earlyStart = false).
      then(runSerial([action1])).
      then(result => expect(result).to.equal(1));
  });

  it(`should run promise actions`, () => {
    let earlyStart = true;
    const action1 = param => new Promise(resolve => {
      expect(earlyStart).to.be.false;
      expect(param).not.to.be.defined;
      resolve(1);
    });
    const action2 = param => new Promise(resolve => {
      expect(param).to.equals(1);
      resolve(2);
    });
    return Promise.resolve({}).
      then(() => earlyStart = false).
      then(runSerial([action1, action2])).
      then(result => expect(result).to.equal(2));
  });

  it(`should enforce task array`, () => {
    expect(() => runSerial([1, 2])).to.throw(/must be a Function/);
  });
});
