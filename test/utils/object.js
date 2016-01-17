'use strict';

const expect = require(`chai`).expect;
const utils = require(`../../src/utils/object`);

describe(`Object utils`, () => {

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
