'use strict';

const expect = require(`chai`).expect;
const Test = require(`../../src/engine/test`);

describe(`Test class`, () => {

  it(`should make fixture replacements`, () => {
    return new Test(`test 1`,
      `module.exports = function() { return 'hi {{name}} !'}`,
      {name: `Virgile`}
    ).run().then(result => expect(result).to.equals(`hi Virgile !`));
  });
});
