'use strict';

const expect = require(`chai`).expect;
const join = require(`path`).join;
const shutdownLoggers = require(`./test-utils`).shutdownLoggers;
const run = require(`../../src/utils/cli-run`);

const fixtures = join(__dirname, `..`, `fixtures`);

describe(`CLI run`, () => {

  shutdownLoggers([`mocha`, `cli-run`]);

  it(`should run test with specified report`, () => {
    return run(join(fixtures, `simple-base.csv`), {reporter: `base`}).
      then(report => {
        expect(report).to.exist;
        expect(report).to.have.property(`tests`).that.equals(1);
      });
  });

  it(`should report runner crash`, () => {
    return run(join(fixtures, `simple-base.csv`), {reporter: `unexisting`}).
      catch(exc => {
        expect(exc).to.exist;
        expect(exc).to.match(/invalid reporter "unexisting"/);
      });
  });

});
