'use strict';

const expect = require(`chai`).expect;
const join = require(`path`).join;
const execute = require(`../../src/engine/executor`);

const fixtures = join(__dirname, `..`, `fixtures`, `generated`);

describe(`Scenario executor`, () => {

  it(`should run file with promise`, () => {
    return execute(join(fixtures, `promise.gen`)).
      then(result => expect(result).to.equals(`hello !`));
  });

  it(`should run file with callback`, () => {
    return execute(join(fixtures, `callback.gen`)).
      then(result => expect(result).to.equals(`salut !`));
  });

  it(`should run synchronous file`, () => {
    return execute(join(fixtures, `sync.gen`)).
      then(result => expect(result).to.equals(`hola !`));
  });

  it(`should report file syntax errors`, done => {
    execute(join(fixtures, `syntax-error.gen`)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(SyntaxError);
        expect(err).to.have.property(`message`).that.includes(`Unexpected token )`);
        done();
      }).catch(done);
  });

  it(`should keep error stacks`, done => {
    execute(join(fixtures, `throw.gen`)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err).to.have.property(`message`).that.includes(`hi !`);
        expect(err.stack).to.include(`throw.gen`);
        done();
      }).catch(done);
  });

  it(`should report synchronous thrown errors`, done => {
    execute(join(fixtures, `throw.gen`)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err).to.have.property(`message`).that.includes(`hi !`);
        done();
      }).catch(done);
  });

  it(`should report asynchronous thrown errors`, done => {
    execute(join(fixtures, `async-throw.gen`)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err).to.have.property(`message`).that.includes(`I'm async`);
        done();
      }).catch(done);
  });

  it(`should report rejected promised`, done => {
    execute(join(fixtures, `promise-rejected.gen`)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err).to.have.property(`message`).that.includes(`I was rejected`);
        done();
      }).catch(done);
  });

  it(`should report declarative callback errors`, done => {
    execute(join(fixtures, `callback-err.gen`)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err).to.have.property(`message`).that.includes(`I'm in a callback !`);
        done();
      }).catch(done);
  });
});
