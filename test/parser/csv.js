'use strict';

const expect = require(`chai`).expect;
const join = require(`path`).join;
const parse = require(`../../src/parser/csv`);
const Base = require(`../../src/scenario/base`);

const fixtures = join(__dirname, `..`, `fixtures`, `csv`);

describe(`CSV Spec parser`, () => {

  it(`should fail on unexisting file`, done => {
    parse(join(fixtures, `unexisting-base.csv`)).
    then(() => done(`should have failed !`)).
    catch(err => {
      expect(err).to.have.property(`message`).that.matches(/ENOENT/);
      done();
    }).catch(done);
  });

  it(`should validate spec file name`, done => {
    parse(join(fixtures, `nospec.csv`)).
    then(() => done(`should have failed !`)).
    catch(err => {
      expect(err).to.have.property(`message`).that.matches(/does not include scenario id/);
      done();
    }).catch(done);
  });

  it(`should check scenario existence`, done => {
    parse(join(fixtures, `spec-unknown.csv`)).
    then(() => done(`should have failed !`)).
    catch(err => {
      expect(err).to.have.property(`message`).that.matches(/unknown is not a known scenario/);
      done();
    }).catch(done);
  });

  it(`should read empty file`, () => {
    return parse(join(fixtures, `empty-base.csv`)).
    then(scenarii => expect(scenarii).to.be.empty);
  });

  it(`should not return header line`, () => {
    return parse(join(fixtures, `simple-base.csv`)).
    then(scenarii => expect(scenarii).to.have.lengthOf(1));
  });

  it(`should cast parsed values`, () => {
    return parse(join(fixtures, `cast-base.csv`)).then(scenarii => {
      expect(scenarii).to.have.lengthOf(1);
      expect(scenarii[0].fixtures).to.have.property(`bool1`).that.is.true;
      expect(scenarii[0].fixtures).to.have.property(`bool2`).that.is.false;
      expect(scenarii[0].fixtures).to.have.property(`str`).that.equals(`a string`);
      expect(scenarii[0].fixtures).to.have.property(`num`).that.equals(10.5);
    });
  });

  it(`should unflatten and parse fixtures paths`, () => {
    return parse(join(fixtures, `flatten-base.csv`)).then(scenarii => {
      expect(scenarii).to.have.lengthOf(1);
      expect(scenarii[0].fixtures).to.deep.equals({a: {b: {c: true, d: 10}}});
    });
  });

  it(`should fail on incorrect CSV`, done => {
    parse(join(fixtures, `broken-base.csv`)).
    then(() => done(`should have failed !`)).
    catch(err => {
      expect(err).to.have.property(`message`).that.match(/Quoted field not terminated/);
      done();
    }).catch(done);
  });

  it(`should generate test names`, () => {
    return parse(join(fixtures, `noname-base.csv`)).then(scenarii => {
      expect(scenarii).to.have.lengthOf(2);
      expect(scenarii[0]).to.be.an.instanceOf(Base);
      expect(scenarii[0]).to.have.property(`name`).that.equals(`test 1`);
      expect(scenarii[1]).to.be.an.instanceOf(Base);
      expect(scenarii[1]).to.have.property(`name`).that.equals(`test 2`);
    });
  });

  it(`should extract Spec instances`, () => {
    return parse(join(fixtures, `simple-base.csv`)).then(scenarii => {
      expect(scenarii).to.have.lengthOf(1);
      expect(scenarii[0]).to.be.an.instanceOf(Base);
      expect(scenarii[0]).to.have.property(`name`).that.equals(`mon test 1`);
      expect(scenarii[0].fixtures).to.have.property(`id`).that.equals(123456);
      expect(scenarii[0].fixtures).to.have.property(`insurer`).that.equals(`IN1`);
      expect(scenarii[0].fixtures).to.have.property(`scoring`).that.equals(`C1`);
    });
  });

});
