'use strict';
/* eslint no-invalid-this: 0 */

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
    return run([
      new Test(`test 1`, `'use strict';
        return () => { throw new Error('failed !'); };
      `, {}),
      new Test(`test 2`, `'use strict';
        return () => 'working !';
      `, {})
    ], opts).then(report => {
      expect(report).to.be.exist;
      expect(report).to.have.property(`tests`).that.equals(2);
      expect(report).to.have.property(`failures`).that.equals(1);
    });
  });

  it(`should execute in specified current directory`, function() {
    this.timeout(3000);

    // given a test that check its own current directory
    const content = `return () => {
      if (process.cwd() !== <$ cwd $>) {
        throw new Error('expected "<$ cwd $>" but got: ' + process.cwd());
      }
    };`;
    return run([
      new Test(`test 1`, content, {cwd: __dirname.replace(/\\/g, `\\\\`)}, 2000, __dirname)
    ], opts).
      then(report => {
        expect(report).to.be.exist;
        expect(report).to.have.property(`tests`).that.equals(1);
        expect(report).to.have.property(`passes`).that.equals(1);
      }).
      then(() => {
        return run([
          new Test(`test 2`, content, {cwd: process.cwd().replace(/\\/g, `\\\\`)})
        ], opts);
      }).
      then(report => {
        expect(report).to.be.exist;
        expect(report).to.have.property(`tests`).that.equals(1);
        expect(report).to.have.property(`passes`).that.equals(1);
      });
  });

  it(`should report timed-out test with custom timeout`, () => {
    const test = new Test(`test 1`, `'use strict';
      return (done) => {};
    `, {}, 500);
    return run([test], opts).then(report => {
      expect(report).to.be.exist;
      expect(report).to.have.property(`tests`).that.equals(1);
      expect(report).to.have.property(`failures`).that.equals(1);
      expect(report).to.have.property(`duration`).at.least(500);
      expect(report).to.have.property(`duration`).that.below(550);
    });
  });

  it(`should report timed-out test with default 2s timeout`, function() {
    this.timeout(3000);
    const test = new Test(`test 1`, `'use strict';
      return (done) => {};
    `, {});
    return run([test], opts).then(report => {
      expect(report).to.be.exist;
      expect(report).to.have.property(`tests`).that.equals(1);
      expect(report).to.have.property(`failures`).that.equals(1);
      expect(report).to.have.property(`duration`).at.least(2000);
      expect(report).to.have.property(`duration`).that.below(2050);
    });
  });



});
