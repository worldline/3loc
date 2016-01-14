'use strict';

const expect = require(`chai`).expect;
const libxml = require(`libxmljs`);
const validate = require(`../../src/actions/validate-xml`);

describe(`XML validatation action`, () => {

  it(`should enforce fixtures`, () => {
    // xml
    expect(() => validate({
    })).to.throw(/"xml" is required/);

    expect(() => validate({
      xml: true
    })).to.throw(/must be a string/);

    // xsd
    expect(() => validate({
      xml: '<msg/>'
    })).to.throw(/"xsd" is required/);

    expect(() => validate({
      xml: '<msg/>',
      xsd: 10
    })).to.throw(/must be a string/);
  });

  it(`should report errored XSD`, done => {
    validate({
      xml: '<msg/>',
      xsd: `coucou`
    }).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`Start tag expected`);
        done();
      }).catch(done);
  });

  it(`should report errored XML`, done => {
    validate({
      xml: {},
      xsd: `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="first-name" type="xs:string"/>
            <xs:element name="last-name" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`
    }).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`xml.validate is not a function`);
        done();
      }).catch(done);
  });

  it(`should report XSD validation errors`, done => {
    validate({
      xml: `<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <toto>Smith</toto>
      </person>`,
      xsd: `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="first-name" type="xs:string"/>
            <xs:element name="last-name" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`
    }).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`element is not expected`);
        done();
      }).catch(done);
  });

  it(`should return libXML.js's documents`, () => {
    return validate({
      xml: `<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
      </person>`,
      xsd: `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="firstname" type="xs:string"/>
            <xs:element name="lastname" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`
    }).
      then(result => {
        expect(result).to.be.an(`object`);
        expect(result).to.have.property(`xml`).that.is.an.instanceof(libxml.Document);
        expect(result).to.have.property(`xsd`).that.is.an.instanceof(libxml.Document);
        let node = result.xml.get(`//person/firstname`);
        expect(node).to.exist;
        expect(node.text()).to.equals(`John`);
        node = result.xml.get(`//person/lastname`);
        expect(node).to.exist;
        expect(node.text()).to.equals(`Smith`);
      });
  });

  it(`should accept XSD as libXML.js's documents`, () => {
    const xsd = libxml.parseXmlString(`
    <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="firstname" type="xs:string"/>
            <xs:element name="lastname" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`);
    return validate({
      xml: `<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
      </person>`,
      xsd
    }).
      then(result => {
        expect(result).to.be.an(`object`);
        expect(result).to.have.property(`xml`).that.is.an.instanceof(libxml.Document);
        expect(result).to.have.property(`xsd`).that.equals(xsd);
      });
  });

  it(`should accept XML as libXML.js's documents`, () => {
    const xml = libxml.parseXmlString(`<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
      </person>`);
    return validate({
      xml,
      xsd: `
    <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="firstname" type="xs:string"/>
            <xs:element name="lastname" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`
    }).
      then(result => {
        expect(result).to.be.an(`object`);
        expect(result).to.have.property(`xsd`).that.is.an.instanceof(libxml.Document);
        expect(result).to.have.property(`xml`).that.equals(xml);
      });
  });


});
