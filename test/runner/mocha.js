'use strict';

const expect = require('chai').expect;
const run = require('../../lib/runner/mocha');
const Base = require('../../lib/scenario/base');

/**
 * Just a scenario that generates failing tests
 */
class Failing extends Base {
  generate() {
    return () => {
      throw new Error('failing !');
    };
  }
}

describe('Mocha runner', () => {

  it('should run without scenarii', () => {
    return run([]).then(report => {
      expect(report).to.be.empty;
    });
  });

  it('should execute failing test an report errors', () => {
    return run([new Failing('test 1')]).then(report => {
      expect(report).to.be.empty;
    });
  });

});
