'use strict';

const expect = require(`chai`).expect;
const Test = require(`../../src/engine/test`);

describe(`Test class`, () => {

  it(`should make fixture replacements`, () => {
    return new Test(`test 1`,
      `return function() { return 'hi <$ name $> !'}`,
      {name: `Virgile`}
    ).run().then(result => expect(result).to.equals(`hi "Virgile" !`));
  });

  it(`should make enforce fixture presence`, () => {
    expect(() => new Test(`test 1`,
      `return function() { return 'hi <$ name $> !'}`
    )).to.throw(/without fixtures/);
  });

  it(`should allow to customize timeout value`, () => {
    expect(new Test(`test 1`, `return () => {}`, {})).to.have.property(`timeout`).that.equals(2000);
    expect(new Test(`test 2`, `return () => {}`, {}, 500)).to.have.property(`timeout`).that.equals(500);
  });

  it(`should use specified current directory`, () => {
    return new Test(`test 1`, `return () => process.cwd();`, {}, null, __dirname).
      run().
      then(result => expect(result).to.equals(__dirname));
  });
});
