'use strict';

const expect = require(`chai`).expect;
const utils = require(`../../src/utils/object`);

describe(`Object utils`, () => {

  describe(`makePromisable`, () => {
    it(`should ensure to be called with function`, () => {
      expect(() => utils.makePromisable({})).to.throw(/must be passed a function/);
      expect(() => utils.makePromisable(Promise.resolve())).to.throw(/must be passed a function/);
    });

    it(`should return a function that looks like a promise`, () => {
      const promisable = utils.makePromisable((p1, p2) => p2 + p1);
      expect(promisable).to.be.a(`Function`).that.has.length(2);
      expect(promisable).to.have.property(`then`);
      expect(promisable.then).to.be.a(`Function`).that.has.length(1);
      expect(promisable).to.have.property(`catch`);
      expect(promisable.catch).to.be.a(`Function`).that.has.length(1);
      expect(promisable).not.to.be.an.instanceOf(Promise);
    });

    it(`should not invoke function immediately`, () => {
      let invoked = false;
      const promisable = utils.makePromisable(() => invoked = true);
      expect(invoked).to.be.false;
      promisable();
      expect(invoked).to.be.true;
    });

    it(`should invoke function on then`, done => {
      let invoked = false;
      const promisable = utils.makePromisable(() => invoked = true);
      expect(invoked).to.be.false;
      promisable.then(res => {
        expect(res).to.be.true;
        expect(invoked).to.be.true;
        done();
      });
    });

    it(`should invoke function on catch`, done => {
      let invoked = false;
      const promisable = utils.makePromisable(() => {
        invoked = true;
        throw new Error(`invoked`);
      });
      expect(invoked).to.be.false;
      promisable.catch(err => {
        expect(err).to.be.an.instanceOf(Error);
        expect(invoked).to.be.true;
        done();
      });
    });
  });

  describe(`setProp`, () => {

    [{
      name: `should set a first level value`,
      obj: {},
      path: `a`,
      value: 10
    }, {
      name: `should set a second level value`,
      obj: {a: {}},
      path: `a.b`,
      value: `coucou`
    }, {
      name: `should creates intermediate object`,
      obj: {},
      path: `a.b.c`,
      value: [true]
    }].forEach(spec =>
      it(spec.name, done => {
        const result = utils.setProp(spec.obj, spec.path, spec.value);
        expect(result).to.equals(spec.obj);
        expect(result).to.have.deep.property(spec.path).that.deep.equals(spec.value);
        done();
      })
    );
  });
});
