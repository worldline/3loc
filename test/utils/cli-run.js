'use strict';

const expect = require(`chai`).expect;
const join = require(`path`).join;
const run = require(`../../lib/utils/cli-run`);
const logger = require(`../../lib/utils/logger`)(`mocha`);

const fixtures = join(__dirname, `..`, `fixtures`);

describe(`CLI run`, () => {

  let loggerLevel;

  before(() => {
    loggerLevel = logger.level;
    logger.level = `off`;
  });

  after(() => {
    logger.level = loggerLevel;
  });

  it(`should run test with specified report`, () => {
    return run(join(fixtures, `simple-base.csv`), {reporter: `base`}).
      then(report => {
        expect(report).to.exist;
        expect(report).to.have.property(`tests`).that.equals(1);
      });
  });
});
