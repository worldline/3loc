'use strict';

const expect = require('chai').expect;
const run = require('../../lib/runner/mocha');
const SpecBase = require('../../lib/spec/base');

/**
 * Just a spec that generates failing tests
 */
class FailingSpec extends SpecBase {
  generateTest() {
    return () => {
      throw new Error('failing !');
    };
  }
}

describe('Mocha runner', () => {

  it('should run without specs', () => {
    return run([]).then(report => {
      expect(report).to.be.empty;
    });
  });

  it('should execute failing test an report errors', () => {
    return run([new FailingSpec('test 1')]).then(report => {
      expect(report).to.be.empty;
    });
  });

});
