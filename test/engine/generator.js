'use strict';

const expect = require(`chai`).expect;
const join = require(`path`).join;
const load = require(`../../src/engine/generator`);

const fixtures = join(__dirname, `..`, `fixtures`, `scn`);

describe(`Test generator`, () => {

  it(`should load scenario and generate test`, () => {
    return load(join(fixtures, `working.js`), {msg: `hello`}).
      then(file => require(file)()).
      then(result => expect(result).to.equals(`hello !`));
  });

});
