'use strict';

const expect = require(`chai`).expect;
const expectContentToInclude = require(`../../src/actions/expect-content-to-include`);
const run = require(`../utils/test-utils`).run;
const shutdownLoggers = require(`../utils/test-utils`).shutdownLoggers;

describe(`Content expectation`, () => {

  shutdownLoggers(`expect:content`);

  it(`should reject missing content`, done => {
    run(expectContentToInclude(`something`)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equals(`\nunexpected content: expected {} to have a property 'content'`);
        done();
      }).catch(done);
  });

  it(`should reject body without string`, done => {
    run(expectContentToInclude(`something`), {content: `this contains toto`}).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equals(`\nunexpected content: expected 'this contains toto' to include 'something'`);
        done();
      }).catch(done);
  });

  it(`should reject body that does not match`, done => {
    run(expectContentToInclude(/toto/), {content: `this contains titi`}).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equals(`\nunexpected content: expected 'this contains titi' to match /toto/`);
        done();
      }).catch(done);
  });

  it(`should accept body containing element`, () => {
    return run(expectContentToInclude(`yeah`), {content: `this contains yeah, really`});
  });

  it(`should accept body matching regexp`, () => {
    return run(expectContentToInclude(/yeah$/), {content: `this contains yeah`});
  });

  it(`should use stack`, done => {
    const stack = [
      `load file f1.txt`,
      `request GET /toto`
    ];
    run(expectContentToInclude(`ho`), {
      content: `haha`,
      _ctx: {stack}
    }).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equals(`\nwhen ${stack.join('\nthen ')}\nunexpected content: expected 'haha' to include 'ho'`);
        done();
      }).catch(done);
  });
});
