'use strict';

const expect = require(`chai`).expect;
const join = require(`path`).join;
const parse = require(`../../src/parser/yaml`);
const Test = require(`../../src/engine/test`);

const fixtures = join(__dirname, `..`, `fixtures`, `yaml`);

describe(`YAML Spec parser`, () => {

  it(`should fail on unexisting file`, done => {
    parse(join(fixtures, `unexisting.yaml`)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.have.property(`message`).that.matches(/ENOENT/);
        done();
      }).catch(done);
  });

  it(`should validate scenario existence`, done => {
    parse(join(fixtures, `noscenario.yaml`)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.have.property(`message`).that.matches(/Missing scenario/);
        done();
      }).catch(done);
  });

  it(`should read empty file`, () => {
    return parse(join(fixtures, `empty.yaml`)).
      then(scenarii => expect(scenarii).to.be.empty);
  });

  it(`should not return header line`, () => {
    return parse(join(fixtures, `simple.yaml`)).
      then(scenarii => expect(scenarii).to.have.lengthOf(1));
  });

  it(`should fail on incorrect YAML`, done => {
    parse(join(fixtures, `broken.yaml`)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.have.property(`message`).that.match(/unexpected end of the stream within a flow collection/);
        done();
      }).catch(done);
  });

  it(`should generate test names`, () => {
    return parse(join(fixtures, `noname.yaml`)).
      then(scenarii => {
        expect(scenarii).to.have.lengthOf(2);
        expect(scenarii[0]).to.be.an.instanceOf(Test);
        expect(scenarii[0]).to.have.property(`name`).that.equals(`test 1`);
        expect(scenarii[1]).to.be.an.instanceOf(Test);
        expect(scenarii[1]).to.have.property(`name`).that.equals(`test 2`);
      });
  });

  it(`should extract test timeout`, () => {
    return parse(join(fixtures, `timeout.yaml`)).then(scenarii => {
      expect(scenarii).to.have.lengthOf(2);
      expect(scenarii[0]).to.be.an.instanceOf(Test);
      expect(scenarii[0]).to.have.property(`timeout`).that.equals(3000);
      expect(scenarii[1]).to.be.an.instanceOf(Test);
      expect(scenarii[1]).to.have.property(`timeout`).that.equals(2000);
    });
  });

  it(`should extract fixtures`, () => {
    return parse(join(fixtures, `simple.yaml`)).
      then(scenarii => {
        expect(scenarii).to.have.lengthOf(1);
        expect(scenarii[0]).to.be.an.instanceOf(Test);
        expect(scenarii[0]).to.have.property(`name`).that.equals(`first test`);
        expect(scenarii[0]).to.have.property(`timeout`).that.equals(500);
        expect(scenarii[0].fixtures).to.have.property(`id`).that.equals(123456);
        expect(scenarii[0].fixtures).to.have.property(`insurer`).that.equals(`IN1`);
        expect(scenarii[0].fixtures).to.have.property(`scoring`).that.equals(`C1`);
        expect(scenarii[0].fixtures).not.to.have.property(`timeout`);
        expect(scenarii[0].fixtures).not.to.have.property(`name`);
        expect(scenarii[0].fixtures).not.to.have.property(`scenario`);
      });
  });

  it(`should cast parsed values`, () => {
    return parse(join(fixtures, `cast.yaml`)).
      then(scenarii => {
        expect(scenarii).to.have.lengthOf(1);
        expect(scenarii[0].fixtures).to.have.property(`bool1`).that.is.true;
        expect(scenarii[0].fixtures).to.have.property(`bool2`).that.is.false;
        expect(scenarii[0].fixtures).to.have.property(`str`).that.equals(`a string`);
        expect(scenarii[0].fixtures).to.have.property(`num`).that.equals(10.5);
      });
  });

  it(`should include common fixture to each scenario with overloading`, () => {
    return parse(join(fixtures, `common.yaml`)).
      then(scenarii => {
        expect(scenarii).to.have.lengthOf(3);
        expect(scenarii[0].fixtures).to.have.property(`custom`).that.equals('scenario 1');
        expect(scenarii[0].fixtures).to.have.property(`common`).that.equals('this is common');
        expect(scenarii[1].fixtures).to.have.property(`custom`).that.equals('scenario 2');
        expect(scenarii[1].fixtures).to.have.property(`common`).that.equals('this is common');
        expect(scenarii[2].fixtures).to.have.property(`custom`).that.equals('scenario 3');
        expect(scenarii[2].fixtures).to.have.property(`common`).that.equals('this is custom');
      });
  });

  it(`should report yaml file inclusion errors`, done => {
    parse(join(fixtures, `inclusion-broken.yaml`)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.have.property(`message`).that.includes(`ENOENT`).and.includes(`unexisting.yaml`);
        done();
      }).catch(done);
  });

  it(`should support yaml file inclusions`, () => {
    return parse(join(fixtures, `inclusion.yaml`)).
      then(scenarii => {
        expect(scenarii).to.have.lengthOf(2);
        expect(scenarii[0].name).to.equals('Test 1');
        expect(scenarii[0].fixtures).to.have.deep.property(`config.param1`).that.is.true;
        expect(scenarii[0].fixtures).to.have.deep.property(`config.param2.in`).that.is.false;
        expect(scenarii[0].fixtures).to.have.deep.property(`config.param2.out`).that.equals(10);
        expect(scenarii[1].name).to.equals('Test 2');
        expect(scenarii[1].fixtures).to.have.deep.property(`config.param1`).that.is.true;
        expect(scenarii[1].fixtures).to.have.deep.property(`config.param2.in`).that.is.false;
        expect(scenarii[1].fixtures).to.have.deep.property(`config.param2.out`).that.equals(10);
      });
  });

  it(`should support make test relative to the scenario location`, () => {
    return parse(join(fixtures, `nested-location.yaml`)).
      then(scenarii => {
        expect(scenarii).to.have.lengthOf(1);
        expect(scenarii[0].name).to.equals('test 1');
        expect(scenarii[0].workdir).to.equals(join(fixtures, `nested`));
        expect(scenarii[0].file).to.equals(join(fixtures, `nested`, `nested.scn`));
      });
  });

  it(`should support make test relative to the spec location with scenario content`, () => {
    return parse(join(fixtures, `default-location.yaml`)).
      then(scenarii => {
        expect(scenarii).to.have.lengthOf(1);
        expect(scenarii[0].name).to.equals('test 1');
        expect(scenarii[0].workdir).to.equals(join(fixtures));
        expect(scenarii[0].file).to.equals(`() => Promise.resolve(process.cwd());`);
      });
  });

});
