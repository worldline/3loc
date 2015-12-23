'use strict';
/* eslint no-console: 0 */

const expect = require(`chai`).expect;
const moment = require(`moment`);
const purgeStyle = require(`./test-utils`).purgeStyle;
const getLogger = require(`../../src/utils/logger`);

describe(`Logger`, () => {

  it(`should build a logger instance`, () => {
    const name = `test-${Math.floor(Math.random() * 10000)}`;
    const logger = getLogger(name);
    expect(logger).to.exist;
    expect(logger).to.have.property(`name`).that.equals(name);
  });

  it(`should reuse created logger instance`, () => {
    const name = `test-${Math.floor(Math.random() * 10000)}`;
    const logger = getLogger(name);
    expect(logger).to.exist;
    expect(logger).to.have.property(`name`).that.equals(name);

    const sameLogger = getLogger(name);
    expect(sameLogger).to.exist.and.to.equals(logger);

    const otherLogger = getLogger(`${name}-1`);
    expect(otherLogger).to.exist.and.not.to.equals(logger);
  });

  describe(`given a mocked console`, () => {

    let original = null;
    let output = [];
    let logger = getLogger(`test`);

    // mock console to avoid printing messages that
    // mess up with test output
    // be warned that while console is mocked, even test output are
    // hidden
    beforeEach(() => {
      output = [];
      original = console.log;
      // use a classical function to get arguments
      console.log = function() {
        output.push(Array.prototype.slice.call(arguments));
      };
    });

    // restore original console if needed
    // always try to restore at test end, because test output comes before
    // afterEach()
    const restoreConsole = () => {
      if (original) {
        console.log = original;
        original = null;
      }
    };

    it(`should ouput timestamped messages`, () => {
      logger.log(`test 1`, 10);
      expect(output).to.have.lengthOf(1);
      let log = output[0];
      restoreConsole();
      expect(log).to.have.lengthOf(4);
      expect(moment(purgeStyle(log[0]), `YYYYMMDD HH:mm:ss SSS`).isValid()).to.be.true;
      expect(log[1]).to.include(logger.name);
      expect(log.slice(2)).to.deep.equals([`test 1`, 10]);
    });

    it(`should not output messages under given level`, () => {
      logger.level = `error`;
      logger.log(`test 1`);
      restoreConsole();
      expect(output).to.have.lengthOf(0);
    });

    it(`should output messages of unknown level`, () => {
      logger.level = `unknown`;
      logger.log(`test 1`);
      restoreConsole();
      expect(output).to.have.lengthOf(1);
    });

    it(`should pad level names to 5 characters`, () => {
      logger.info(`test 1`);
      restoreConsole();
      expect(output).to.have.lengthOf(1);
      expect(purgeStyle(output[0][1])).to.includes('[ info]');
    });

    it(`should pad logger names to 10 characters`, () => {
      logger.info(`test 1`);
      restoreConsole();
      expect(output).to.have.lengthOf(1);
      expect(purgeStyle(output[0][1])).to.includes('      test [');
    });

    it(`should restrict logger names to 10 characters`, () => {
      logger.name = 'too-big-to-fit';
      logger.log(`test 1`);
      restoreConsole();
      expect(output).to.have.lengthOf(1);
      expect(purgeStyle(output[0][1])).to.includes('too-big-t… [');
    });

    const levels = [`debug`, `info`, `warn`, `error`];
    for (let i = 0; i < levels.length; i++) {
      let level = levels[i];
      it(`should expose ${level} function`, () => {
        let message = `something ${Math.floor(Math.random() * 1000)}`;
        logger.level = level;
        expect(logger).to.have.property(level).that.is.an.instanceOf(Function);
        logger[level](message);
        restoreConsole();
        expect(output).to.have.lengthOf(1);
        expect(output[0]).to.include(message);
        expect(output[0][1]).to.include(level);
      });
    }

    afterEach(restoreConsole);
  });
});
