'use strict';
/* eslint no-console: 0 */

const expect = require(`chai`).expect;
const moment = require(`moment`);
const fs = require(`fs`);
const purgeStyle = require(`./test-utils`).purgeStyle;
const randomInt = require(`./test-utils`).randomInt;
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

  describe(`given no configuration file`, () => {

    let confPath = `logging.properties`;

    beforeEach(done => {
      fs.unlink(confPath, () => done());
    });

    after(done => {
      fs.unlink(confPath, () => done());
    });

    it(`should read level from file for new loggers`, done => {
      fs.writeFile(confPath, `[test:logger1]\nlevel=warn\n\n[logger2]\nlevel=error`, err => {
        expect(err).not.to.exist;
        setTimeout(() => {
          expect(getLogger(`test:logger1`).level).to.equals(`warn`);
          expect(getLogger(`logger2`).level).to.equals(`error`);
          done();
        }, 10);
      });
    });

    it(`should reload level on file change`, done => {
      const num = randomInt();
      const logger = getLogger(`my-logger${num}`);
      expect(logger.level).to.equals(`warn`);
      fs.writeFile(confPath, `[my-logger${num}]\nlevel=debug`, err => {
        expect(err).not.to.exist;
        setTimeout(() => {
          expect(logger.level).to.equals(`debug`);
          fs.writeFile(confPath, `[my-logger${num}]\nlevel=error`, err2 => {
            expect(err2).not.to.exist;
            setTimeout(() => {
              expect(logger.level).to.equals(`error`);
              done();
            }, 10);
          });
        }, 10);
      });
    });

    it(`should not update unspecified logger`, done => {
      const num = randomInt();
      fs.writeFile(confPath, `[my-logger${num}]\nlevel=warn`, err => {
        expect(err).not.to.exist;
        const logger = getLogger(`my-logger${num}`);
        setTimeout(() => {
          expect(logger.level).to.equals(`warn`);
          fs.writeFile(confPath, `[my-logger${num}]\nsomething:else`, err2 => {
            expect(err2).not.to.exist;
            setTimeout(() => {
              expect(logger.level).to.equals(`warn`);
              done();
            }, 10);
          });
        }, 10);
      });
    });

    it(`should not complain with invalid file`, done => {
      const num = randomInt();
      // file can't be read
      fs.writeFile(confPath, ``, err => {
        expect(err).not.to.exist;
        fs.chmod(confPath, `200`, err2 => {
          expect(err2).not.to.exist;
          const logger = getLogger(`my-logger${num}`);
          expect(logger.level).to.equals(`warn`);
          done();
        });
      });
    });

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
      logger.warn(`test 1`, 10);
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
