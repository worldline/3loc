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
      return utils.compile(`Hi {{name}}`, {name: 'Florian'}).
        then(content => {
          expect(content).to.equals(`Hi Florian`);
        });
    });

    it(`should ingore empty or null template`, () => {
      return utils.compile(``, {}).
        then(content => {
          expect(content).to.be.empty;
        }).
        then(() => utils.compile())
        .then(content => {
          expect(content).to.be.empty;
        });
    });

    it(`should failed on misformated template`, done => {
      utils.compile(`Hi {{/end}}`, {}).
        then(() => done(`should have failed !`)).
        catch(err => {
          expect(err.message).to.include(`Closing tag without opener`);
          done();
        }).catch(done);
    });
  });

});
