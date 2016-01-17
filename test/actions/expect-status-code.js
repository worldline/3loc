'use strict';

const expect = require(`chai`).expect;
const expectStatusCode = require(`../../src/actions/expect-status-code`);
const run = require(`../utils/test-utils`).run;
const shutdownLoggers = require(`../utils/test-utils`).shutdownLoggers;

describe(`Status code expectation`, () => {

  shutdownLoggers(`expect:status`);

  it(`should reject no code`, done => {
    run(expectStatusCode(200)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equals(`\nunexpected status code: expected {} to have a property 'code'`);
        done();
      }).catch(done);
  });

  it(`should reject wrong code`, done => {
    run(expectStatusCode(200), {code: 500}).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equals(`\nunexpected status code: expected 500 to equal 200`);
        done();
      }).catch(done);
  });

  it(`should accept good code`, () => {
    return run(expectStatusCode(404), {code: 404});
  });

  it(`should use stack`, done => {
    const stack = [
      `load file f1.txt`,
      `request GET /toto`
    ];
    run(expectStatusCode(200), {
      code: 500,
      _ctx: {stack}
    }).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equals(`\nwhen ${stack.join('\nthen ')}\nunexpected status code: expected 500 to equal 200`);
        done();
      }).catch(done);
  });
});
