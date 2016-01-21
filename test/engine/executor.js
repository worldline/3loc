'use strict';

const expect = require(`chai`).expect;
const execute = require(`../../src/engine/executor`);

describe(`Test executor`, () => {

  it(`should run file with promise`, () => {
    return execute(`return Promise.resolve('bonjour !');`).
      then(result => expect(result).to.equals(`bonjour !`));
  });

  it(`should run file with callback`, () => {
    return execute(`
return done => {
  setTimeout(() => {
    done(null, 'salut !');
  }, 1);
};`).
      then(result => expect(result).to.equals(`salut !`));
  });

  it(`should run synchronous file`, () => {
    return execute(`return () => 'hola !';`).
      then(result => expect(result).to.equals(`hola !`));
  });

  it(`should run file returning promise`, () => {
    return execute(`return () => Promise.resolve('hello !');`).
      then(result => expect(result).to.equals(`hello !`));
  });

  it(`should report file syntax errors`, done => {
    execute(`return () => {`).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(SyntaxError);
        expect(err).to.have.property(`message`).that.includes(`Unexpected token )`);
        done();
      }).catch(done);
  });

  it.skip(`should keep error stacks`, done => {
    execute(`
  const f1 = () => f2();
  const f2 = () => {
    throw new Error('see my stack !');
  };
  return () => f1()`).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err).to.have.property(`message`).that.includes(`stack !`);
        expect(err.stack).to.include(`f1`);
        expect(err.stack).to.include(`f2`);
        done();
      }).catch(done);
  });

  it(`should report synchronous thrown errors`, done => {
    execute(`
 return () => {
   throw new Error('hi !');
 };`).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err).to.have.property(`message`).that.includes(`hi !`);
        done();
      }).catch(done);
  });

  it(`should report asynchronous thrown errors`, done => {
    execute(`
return () => new Promise(() => {
  setTimeout(() => {
    throw new Error("I'm async !");
  }, 1);
});`).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err).to.have.property(`message`).that.includes(`I'm async`);
        done();
      }).catch(done);
  });

  it(`should report rejected promised`, done => {
    execute(`
return () => new Promise((resolve, reject) => {
  setTimeout(() => {
    reject(new Error('I was rejected !'));
  }, 1);
});`).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err).to.have.property(`message`).that.includes(`I was rejected`);
        done();
      }).catch(done);
  });

  it(`should report declarative callback errors`, done => {
    execute(`
return done => {
  setTimeout(() => {
    done(new Error("I'm in a callback !"));
  }, 1);
};`).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err).to.have.property(`message`).that.includes(`I'm in a callback !`);
        done();
      }).catch(done);
  });

  it(`should use default current directory`, () => {
    return execute(`return () => process.cwd();`).
      then(result => expect(result).to.equals(process.cwd()));
  });

  it(`should use specified current directory`, () => {
    return execute(`return () => process.cwd();`, __dirname).
      then(result => expect(result).to.equals(__dirname));
  });
});
