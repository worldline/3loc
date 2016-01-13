'use strict';

const expect = require(`chai`).expect;
const run = require(`../../src/runner/mocha`);
const Test = require(`../../src/engine/test`);
const shutdownLoggers = require(`../utils/test-utils`).shutdownLoggers;

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
    return run([new Test(`test 1`, `'use strict';
      return () => { throw new Error('failed !'); };
    `, {}), new Test(`test 2`, `'use strict';
      return () => 'working !';
    `, {})], opts).then(report => {
      expect(report).to.be.exist;
      expect(report).to.have.property(`tests`).that.equals(2);
      expect(report).to.have.property(`failures`).that.equals(1);
    });
  });

});
