'use strict';

const expect = require(`chai`).expect;
const join = require(`path`).join;
const utils = require(`../../src/utils/file`);

const fixtures = join(__dirname, `..`, `fixtures`);

describe(`file utils`, () => {

  describe(`load`, () => {

    it(`should load file content`, () => {
      return utils.load(join(fixtures, `req2.txt`)).
        then(content => {
          expect(content).to.equals(`bonjour !`);
        });
    });

    it(`should failed on unknown file`, done => {
      utils.load(`unknwon.txt`).
        then(() => done(`should have failed !`)).
        catch(err => {
          expect(err.message).to.include(`ENOENT`);
          done();
        }).catch(done);
    });
  });

  describe(`compile`, () => {

    it(`should make template replacement`, () => {
      return utils.compile(`Hi <$ name $>`, {name: `Florian`}).
        then(content => {
          expect(content).to.equals(`Hi "Florian"`);
        });
    });

    it(`should support nesting`, () => {
      return utils.compile(`Hi <$ person.name $>`, {
        person: {name: `Florian`}
      }).
        then(content => {
          expect(content).to.equals(`Hi "Florian"`);
        });
    });

    it(`should replace with data structure`, () => {
      return utils.compile(`Hi <$ person $>`, {
        person: {name: `Florian`}
      }).
        then(content => {
          expect(content).to.equals(`Hi {"name":"Florian"}`);
        });
    });

    it(`should serialize arrays`, () => {
      return utils.compile(`Hi <$ guys $>`, {
        guys: [`Virgile`, `Sylvain`, `Sebastian`]
      }).
        then(content => {
          expect(content).to.equals(`Hi ["Virgile","Sylvain","Sebastian"]`);
        });
    });

    it(`should serialize booleans and number`, () => {
      return utils.compile(`We are <$ num $> peoples in team ? <$ right $>`, {
        num: 5,
        right: true
      }).
        then(content => {
          expect(content).to.equals(`We are 5 peoples in team ? true`);
        });
    });

    it(`should refer parent data`, () => {
      return utils.compile(`<% for p in persons %><$ p.name $> <$ num $><% endfor %>`, {
        persons: [{name: `Florian`}],
        num: 1
      }).
        then(content => {
          expect(content).to.equals(`"Florian" 1`);
        });
    });

    it(`should ingore empty or null template`, () => {
      return utils.compile(``, {}).
        then(content => {
          expect(content).to.be.empty;
        }).
        then(() => utils.compile()).
        then(content => {
          expect(content).to.be.empty;
        });
    });

    it(`should failed on misformated template`, done => {
      utils.compile(`Hi <% end >`, {}).
        then(() => done(`should have failed !`)).
        catch(err => {
          expect(err.message).to.include(`unknown block tag`);
          done();
        }).catch(done);
    });

    it(`should failed on missing data`, done => {
      utils.compile(`Hi <$ name $>`, {}).
        then(() => done(`should have failed !`)).
        catch(err => {
          expect(err.message).to.include(`attempted to output null`);
          done();
        }).catch(done);
    });
  });

});
