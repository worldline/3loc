'use strict';

const expect = require('chai').expect;
const join = require('path').join;
const parse = require('../../lib/parser/csv');
const SpecBase = require('../../lib/spec/base');

const fixtures = join(__dirname, '..', 'fixtures');

describe('CSV Spec parser', () => {

  it('should fail on unexisting file', () => {
    return parse(join(fixtures, 'unexisting-base.csv')).catch(err => {
      expect(err).to.have.property('message').that.match(/ENOENT/);
    });
  });

  it('should read empty file', () => {
    return parse(join(fixtures, 'empty-base.csv')).then(specs => {
      expect(specs).to.be.empty;
    });
  });

  it('should not return header line', () => {
    return parse(join(fixtures, 'simple-base.csv')).then(specs => {
      expect(specs).to.have.lengthOf(1);
    });
  });

  it('should fail on incorrect CSV', () => {
    return parse(join(fixtures, 'broken-base.csv')).catch(err => {
      expect(err).to.have.property('message').that.match(/Quoted field not terminated/);
    });
  });

  it('should not extract Spec instances', () => {
    return parse(join(fixtures, 'simple-base.csv')).then(specs => {
      expect(specs).to.have.lengthOf(1);
      expect(specs[0]).to.be.an.instanceOf(SpecBase);
      expect(specs[0].fixtures).to.have.property('id').that.equals(123456);
      expect(specs[0].fixtures).to.have.property('insurer').that.equals('IN1');
      expect(specs[0].fixtures).to.have.property('scoring').that.equals('C1');
    });
  });

});
