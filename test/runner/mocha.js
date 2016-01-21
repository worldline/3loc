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

  it(`should execute in specified current directory`, () => {
    // given a test that check its own current directory
    const content = `return () => {
      if (process.cwd() !== '<$ cwd $>') {
        throw new Error('expected <$ cwd $> but got: ' + process.cwd());
      }
    };`;
    return run([
      new Test(`test 1`, content, {cwd: __dirname.replace(/\\/g, `\\\\`)}, __dirname)
    ], opts).
      then(report => {
        expect(report).to.be.exist;
        expect(report).to.have.property(`tests`).that.equals(1);
        expect(report).to.have.property(`passes`).that.equals(1);
      }).
      then(() => {
        return run([
          new Test(`test 2`, content, {cwd: process.cwd().replace(/\\/g, `\\\\`)})
        ], null, opts);
      }).
      then(report => {
        expect(report).to.be.exist;
        expect(report).to.have.property(`tests`).that.equals(1);
        expect(report).to.have.property(`passes`).that.equals(1);
      });
  });

});
