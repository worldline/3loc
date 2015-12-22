'use strict';

const expect = require('chai').expect;
const join = require('path').join;
const parse = require('../../lib/parser/csv');
const Base = require('../../lib/scenario/base');

const fixtures = join(__dirname, '..', 'fixtures');

describe('CSV Spec parser', () => {

  it('should fail on unexisting file', () => {
    return parse(join(fixtures, 'unexisting-base.csv')).catch(err => {
      expect(err).to.have.property('message').that.match(/ENOENT/);
    });
  });

  it('should read empty file', () => {
    return parse(join(fixtures, 'empty-base.csv')).then(scenarii => {
      expect(scenarii).to.be.empty;
    });
  });

  it('should not return header line', () => {
    return parse(join(fixtures, 'simple-base.csv')).then(scenarii => {
      expect(scenarii).to.have.lengthOf(1);
    });
  });

  it('should fail on incorrect CSV', () => {
    return parse(join(fixtures, 'broken-base.csv')).catch(err => {
      expect(err).to.have.property('message').that.match(/Quoted field not terminated/);
    });
  });

  it('should not extract Spec instances', () => {
    return parse(join(fixtures, 'simple-base.csv')).then(scenarii => {
      expect(scenarii).to.have.lengthOf(1);
      expect(scenarii[0]).to.be.an.instanceOf(Base);
      expect(scenarii[0].fixtures).to.have.property('id').that.equals(123456);
      expect(scenarii[0].fixtures).to.have.property('insurer').that.equals('IN1');
      expect(scenarii[0].fixtures).to.have.property('scoring').that.equals('C1');
    });
  });

});
