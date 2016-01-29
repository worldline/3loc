'use strict';

const expect = require(`chai`).expect;
const helpers = require(`../../src/helpers`);

describe(`Nunjucks helpers`, () => {

  describe(`stringify`, () => {

    it(`should stringify plain variables`, () => {
      expect(helpers.stringify(true)).to.equals(`true`);
      expect(helpers.stringify(18.4)).to.equals(`18.4`);
      expect(helpers.stringify(`something`)).to.equals(`"something"`);
      expect(helpers.stringify(null)).to.equals(`null`);
    });

    it(`should stringify arrays`, () => {
      expect(helpers.stringify([])).to.equals(`[]`);
      expect(helpers.stringify([1, 2, 3])).to.equals(`[1,2,3]`);
      expect(helpers.stringify([`the`, `quick`, `fox`])).to.equals(`["the","quick","fox"]`);
    });

    it(`should stringify objects`, () => {
      expect(helpers.stringify({})).to.equals(`{}`);
      expect(helpers.stringify({one: 1, two: `two`})).to.equals(`{"one":1,"two":"two"}`);
      expect(helpers.stringify({
        enabled: true,
        loggers: [{
          name: `actions`,
          level: `debug`
        }]
      })).to.equals(`{"enabled":true,"loggers":[{"name":"actions","level":"debug"}]}`);
    });
  });

  describe(`lodash methods`, () => {

    it(`should be available`, () => {
      expect(helpers).to.have.property(`merge`).that.is.a(`function`);
    });

    it(`should be invoked`, () => {
      expect(helpers.add(7, 8)).to.equals(15);
    });
  });

});
