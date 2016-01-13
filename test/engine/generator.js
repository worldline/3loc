'use strict';

const expect = require(`chai`).expect;
const path = require(`path`);
const load = require(`../../src/engine/generator`);

const fixtures = path.join(__dirname, `..`, `fixtures`, `scn`);

describe(`Test generator`, () => {

  it(`should load scenario and generate test`, () => {
    return load(path.join(fixtures, `working.js`), {msg: `hello`}).
      then(file => {
        expect(path.extname(file)).to.equals('.js');
        expect(path.basename(file).replace(/.js$/, '')).to.be.a.number;
        return require(file)();
      }).
      then(result => expect(result).to.equals(`hello !`));
  });

  it(`should use scenario string content to generate test`, () => {
    return load(`module.exports = function() {return '{{msg}} !';}`, {msg: `hi`}).
      then(file => {
        expect(path.extname(file)).to.equals('.js');
        expect(path.basename(file).replace(/.js$/, '')).to.be.a.number;
        return require(file)();
      }).
      then(result => expect(result).to.equals(`hi !`));
  });
});
