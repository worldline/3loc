'use strict';

const expect = require(`chai`).expect;
const path = require(`path`);
const load = require(`../../src/engine/generator`);

const fixtures = path.join(__dirname, `..`, `fixtures`, `scn`);

// In that case, we DO want to execute generated code
/* eslint no-new-func: 0 */

describe(`Test generator`, () => {

  it(`should load scenario and generate test`, () => {
    return load(path.join(fixtures, `working.scn`), {msg: `hello`}).
      then(content => {
        expect(content).to.include('hello');
        const test = Function(content)();
        return test();
      }).
      then(result => expect(result).to.equals(`hello !`));
  });

  it(`should use scenario string content to generate test`, () => {
    return load(`return function() {return '<$ msg $> !'}`, {msg: `hi`}).
      then(content => {
        expect(content).to.include('hi');
        const test = Function(content)();
        expect(test()).to.equals(`hi !`);
      });
  });
});
