'use strict';

const expect = require(`chai`).expect;
const Base = require(`../../src/scenario/base`);

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
    let test = new Base(`test`).generate();
    expect(test).to.be.an.instanceOf(Function);
    expect(test).to.have.lengthOf(0);
    expect(test).to.throw(/not implemented/);
  });
});
