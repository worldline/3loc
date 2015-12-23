'use strict';

const expect = require(`chai`).expect;
const run = require(`../../src/runner/mocha`);
const Base = require(`../../src/scenario/base`);
const shutdownLoggers = require(`../utils/test-utils`).shutdownLoggers;

/**
 * Just a scenario that generates failing tests
 */
class Failing extends Base {
  generate() {
    return () => {
      throw new Error(`failing !`);
    };
  }
}

const opts = {reporter: `base`};

describe(`Mocha runner`, () => {

  shutdownLoggers(`mocha`);

  it(`should run without scenarii`, () => {
    return run([], opts).then(report => {
      expect(report).to.be.exist;
      expect(report).to.have.property(`tests`).that.equals(0);
      expect(report).to.have.property(`failures`).that.equals(0);
    });
  });

  it(`should execute failing test an report errors`, () => {
    return run([new Failing(`test 1`, {})], opts).then(report => {
      expect(report).to.be.exist;
      expect(report).to.have.property(`tests`).that.equals(1);
      expect(report).to.have.property(`failures`).that.equals(1);
    });
  });

});
