'use strict';

const expect = require(`chai`).expect;
const join = require(`path`).join;
const shutdownLoggers = require(`./test-utils`).shutdownLoggers;
const run = require(`../../src/utils/cli-run`);

const fixtures = join(__dirname, `..`, `fixtures`);

describe(`CLI run`, () => {

  shutdownLoggers([`mocha`, `cli-run`]);

  it(`should run test with specified report`, () => {
    return run(join(fixtures, `csv`, `simple.csv`), {reporter: `base`}).
      then(report => {
        expect(report).to.exist;
        expect(report).to.have.property(`tests`).that.equals(1);
      });
  });

  it(`should report runner crash`, done => {
    run(join(fixtures, `csv`, `simple.csv`), {reporter: `unexisting`}).
      then(() => done(`should have failed`)).
      catch(exc => {
        expect(exc).to.exist;
        expect(exc).to.match(/invalid reporter "unexisting"/);
        done();
      }).catch(done);
  });

  it(`should automatically detect parser to use`, () => {
    return run(join(fixtures, `yaml`, `simple.yaml`), {reporter: `base`}).
      then(report => {
        expect(report).to.exist;
        expect(report).to.have.property(`tests`).that.equals(1);
      });
  });

  it(`should fails on unknown spec format`, done => {
    run(`unsupported.xml`, {reporter: `base`}).
      then(() => done(`should have failed !`)).
      catch(exc => {
        expect(exc.message).to.include(`Unsupported`);
        done();
      }).catch(done);
  });

});
