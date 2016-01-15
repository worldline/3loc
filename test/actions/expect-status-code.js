'use strict';

const expect = require(`chai`).expect;
const expectStatusCode = require(`../../src/actions/expect-status-code`);

describe(`Status code expectation`, () => {

  it(`should reject no code`, done => {
    Promise.resolve({}).
      then(expectStatusCode(200)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equals(`\nunexpected status code: expected {} to have a property 'code'`);
        done();
      }).catch(done);
  });

  it(`should reject wrong code`, done => {
    Promise.resolve({code: 500}).
      then(expectStatusCode(200)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equals(`\nunexpected status code: expected 500 to equal 200`);
        done();
      }).catch(done);
  });

  it(`should accept good code`, () => {
    return Promise.resolve({code: 404}).
      then(expectStatusCode(404));
  });

  it(`should use stack`, done => {
    const stack = [
      `load file f1.txt`,
      `request GET /toto`
    ];
    Promise.resolve({
      code: 500,
      _ctx: {stack}
    }).
      then(expectStatusCode(200)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equals(`\nwhen ${stack.join('\nthen ')}\nunexpected status code: expected 500 to equal 200`);
        done();
      }).catch(done);
  });
});
