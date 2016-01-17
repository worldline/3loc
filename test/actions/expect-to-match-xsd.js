'use strict';

const expect = require(`chai`).expect;
const libxml = require(`libxmljs`);
const expectToMatchXsd = require(`../../src/actions/expect-to-match-xsd`);

describe(`XML validatation action`, () => {

  it(`should enforce fixtures`, () => {
    expect(() => expectToMatchXsd(10)).
      to.throw(/must be a string/);

    expect(() => expectToMatchXsd({toto: true})).
      to.throw(/must be an instance of "Document"/);
  });

  it(`should report errored XSD`, done => {
    expectToMatchXsd(`coucou`).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`Start tag expected`);
        done();
      }).catch(done);
  });

  it(`should report errored XML`, done => {
    Promise.resolve({
      content: {}
    }).
      then(expectToMatchXsd(`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="person">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="first-name" type="xs:string"/>
              <xs:element name="last-name" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:schema>`)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`xml.validate is not a function`);
        done();
      }).catch(done);
  });

  it(`should report XSD validation errors`, done => {
    Promise.resolve({
      content: `<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <toto>Smith</toto>
      </person>`
    }).
      then(expectToMatchXsd(`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="person">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="first-name" type="xs:string"/>
              <xs:element name="last-name" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:schema>`)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`element is not expected`);
        done();
      }).catch(done);
  });

  it(`should return libXML.js's documents`, () => {
    return Promise.resolve({
      content: `<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
      </person>`
    }).
      then(expectToMatchXsd(`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="firstname" type="xs:string"/>
            <xs:element name="lastname" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`)).
      then(result => {
        expect(result).to.be.an(`object`);
        expect(result).to.have.property(`content`).that.is.an.instanceof(libxml.Document);
        let node = result.content.get(`//person/firstname`);
        expect(node).to.exist;
        expect(node.text()).to.equals(`John`);
        node = result.content.get(`//person/lastname`);
        expect(node).to.exist;
        expect(node.text()).to.equals(`Smith`);
      });
  });

  it(`should accept XSD as Promise`, () => {
    const content = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="firstname" type="xs:string"/>
            <xs:element name="lastname" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`;
    return Promise.resolve({
      content: `<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
      </person>`
    }).
      then(expectToMatchXsd(Promise.resolve({content}))).
      then(result => {
        expect(result).to.be.an(`object`);
        expect(result).to.have.property(`content`).that.is.an.instanceof(libxml.Document);
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
    return Promise.resolve({
      content: `<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
      </person>`
    }).
      then(expectToMatchXsd(xsd)).
      then(result => {
        expect(result).to.be.an(`object`);
        expect(result).to.have.property(`content`).that.is.an.instanceof(libxml.Document);
      });
  });

  it(`should accept XML as libXML.js's documents`, () => {
    const content = libxml.parseXmlString(`<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
      </person>`);
    return Promise.resolve({content}).
      then(expectToMatchXsd(`
    <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="firstname" type="xs:string"/>
            <xs:element name="lastname" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`)).
      then(result => {
        expect(result).to.be.an(`object`);
        expect(result).to.have.property(`content`).that.equals(content);
      });
  });

  it(`should use stack`, done => {
    const stack = [
      `load file f1.txt`,
      `request GET /toto`
    ];
    const content = `<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
      </person>`;
    const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="first-name" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`;
    Promise.resolve({
      content,
      _ctx: {stack}
    }).
      then(expectToMatchXsd(xsd)).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equals(`\nwhen ${stack.join('\nthen ')}\ninvalid XML: Element 'firstname': This element is not expected. Expected is ( first-name ).`);
        done();
      }).catch(done);
  });
});
