'use strict';

const expect = require(`chai`).expect;
const Joi = require(`joi`);
const Base = require(`../../src/scenario/base`);

// a scenario that has a test waiting for a callback parameter
class CallbackScenario extends Base {

  // define a schema for fixtures data
  static get schema() {
    return Joi.object({
      works: Joi.boolean().required(),
      raised: Joi.boolean()
    });
  }

  generate() {
    return done => {
      setTimeout(() => {
        if (this.fixtures.raised && !this.fixtures.works) {
          throw new Error(`not working !`);
        }
        done(this.fixtures.works ? null : new Error(`not working !`));
      }, 0);
    };
  }
}

// a scenario that has a test returning a promise
class PromiseScenario extends Base {

  static get schema() {
    return Joi.object({
      fails: Joi.boolean().required(),
      raised: Joi.boolean()
    });
  }

  generate() {
    return () => new Promise((resolve, reject) => {
      if (this.fixtures.raised && this.fixtures.fails) {
        throw new Error(`fails !`);
      }
      if (this.fixtures.fails) {
        reject(new Error(`fails !`));
      } else {
        resolve();
      }
    });
  }
}

// a scenario that has a synchrnous test
class SynchronousScenario extends Base {

  static get schema() {
    return Joi.object({
      errored: Joi.boolean().required()
    });
  }

  generate() {
    return () => {
      if (this.fixtures.errored) {
        throw new Error(`error !`);
      }
    };
  }
}

class ComplexScenario extends Base {

  static get schema() {
    return Joi.object({
      works: Joi.boolean().required(),
      errored: Joi.boolean().required(),
      fails: Joi.boolean().required(),
      raised: Joi.boolean()
    });
  }

  constructor(name, fixtures) {
    super(name, fixtures);
    this.test1 = new SynchronousScenario(name, {errored: fixtures.errored});
    this.test2 = new PromiseScenario(name, {fails: fixtures.fails, raised: fixtures.raised});
    this.test3 = new CallbackScenario(name, {works: fixtures.works, raised: fixtures.raised});
  }

  generate() {
    return () => Promise.all([this.test2.run(), this.test1.run()]).then(this.test3.run.bind(this.test3));
  }
}

describe(`Base scenario`, () => {

  it(`should accept name and fixtures in constructor`, () => {
    const name = `name-${Math.floor(Math.random() * 100)}`;
    const fixtures = {
      something: true,
      data: [1, 2, 3],
      subData: {
        works: `well`
      }
    };
    let scenario = new Base(name, fixtures);
    expect(scenario).to.have.property(`name`).that.equals(name);
    expect(scenario).to.have.property(`fixtures`).that.deep.equals(fixtures);
  });

  it(`should have an empty generate method`, () => {
    let test = new Base(`test`, {}).generate();
    expect(test).to.be.an.instanceOf(Function);
    expect(test).to.have.lengthOf(0);
    expect(test).to.throw(/not implemented/);
  });

  it(`should be ran`, done => {
    new Base(`test`, {}).run().
      then(() => done(`should have failed !`)).
      catch(exc => {
        expect(exc).to.exist;
        expect(exc.message).to.match(/not implemented/);
        done();
      });
  });

  describe(`given a scenario with validation`, () => {

    it(`should validates fixtures data presence`, () => {
      expect(() =>
        new CallbackScenario(`test`)
      ).to.throw(/without fixtures/);
    });

    it(`should not allowed empty fixtures`, () => {
      expect(() =>
        new CallbackScenario(`test`, {})
      ).to.throw(/"works" is required/);
    });

    it(`should validates fixtures data content`, () => {
      expect(() =>
        new CallbackScenario(`test`, {works: true, unknown: []})
      ).to.throw(/"unknown" is not allowed/);
    });
  });

  describe(`given a scenario with callback test`, () => {

    it(`should be ran in callback-style`, () => {
      return new CallbackScenario(`test`, {works: true}).
        run().
        then(arg => expect(arg).not.to.exist);
    });

    it(`should collect declarative error in callback-style`, done => {
      new CallbackScenario(`test`, {works: false}).
        run().
        then(() => done(`should have failed !`)).
        catch(exc => {
          expect(exc).to.exist;
          expect(exc.message).to.equals(`not working !`);
          done();
        });
    });

    it(`should collect raised error in callback-style`, done => {
      new CallbackScenario(`test`, {works: false, raised: true}).
        run().
        then(() => done(`should have failed !`)).
        catch(exc => {
          expect(exc).to.exist;
          expect(exc.message).to.equals(`not working !`);
          done();
        });
    });
  });

  describe(`given a scenario with promise test`, () => {

    it(`should be ran in promise-style`, () => {
      return new PromiseScenario(`test`, {fails: false}).
        run().
        then(arg => expect(arg).not.to.exist);
    });

    it(`should collect declarative error in promise-style`, done => {
      new PromiseScenario(`test`, {fails: true}).
        run().
        then(() => done(`should have failed !`)).
        catch(exc => {
          expect(exc).to.exist;
          expect(exc.message).to.equals(`fails !`);
          done();
        });
    });

    it(`should collect raised error in promise-style`, done => {
      new PromiseScenario(`test`, {fails: true, raised: true}).
        run().
        then(() => done(`should have failed !`)).
        catch(exc => {
          expect(exc).to.exist;
          expect(exc.message).to.equals(`fails !`);
          done();
        });
    });
  });

  describe(`given a scenario with synchronous test`, () => {

    it(`should be ran in synchronous-style`, () => {
      return new SynchronousScenario(`test`, {errored: false}).
        run().
        then(arg => {
          expect(arg).not.to.exist;
        });
    });

    it(`should collect error in synchronous-style`, done => {
      new SynchronousScenario(`test`, {errored: true}).
        run().
        then(() => done(`should have failed !`)).
        catch(exc => {
          expect(exc).to.exist;
          expect(exc.message).to.equals(`error !`);
          done();
        });
    });
  });

  describe(`given a complex scenario`, () => {

    it(`should be ran`, () => {
      return new ComplexScenario(`test`, {
        errored: false,
        fails: false,
        works: true
      }).
        run().
        then(arg => expect(arg).not.to.exist);
    });

    it(`should collect error within synchronous code`, done => {
      return new ComplexScenario(`test`, {
        errored: true,
        fails: false,
        works: true
      }).
        run().
        then(() => done(`should have failed !`)).
        catch(exc => {
          expect(exc).to.exist;
          expect(exc.message).to.equals(`error !`);
          done();
        });
    });

    it(`should collect error within promise code`, done => {
      return new ComplexScenario(`test`, {
        errored: false,
        fails: true,
        works: true
      }).
        run().
        then(() => done(`should have failed !`)).
        catch(exc => {
          expect(exc).to.exist;
          expect(exc.message).to.equals(`fails !`);
          done();
        });
    });

    it(`should collect error within callback code`, done => {
      return new ComplexScenario(`test`, {
        errored: false,
        fails: false,
        works: false
      }).
        run().
        then(() => done(`should have failed !`)).
        catch(exc => {
          expect(exc).to.exist;
          expect(exc.message).to.equals(`not working !`);
          done();
        });
    });
  });

});
