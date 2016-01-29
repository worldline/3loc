'use strict';

const expect = require(`chai`).expect;
const libxml = require(`libxml-xsd`).libxmljs;
const join = require(`path`).join;
const run = require(`../utils/test-utils`).run;
const shutdownLoggers = require(`../utils/test-utils`).shutdownLoggers;
const expectToMatchXsd = require(`../../src/actions/expect-to-match-xsd`);

describe(`XML validatation action`, () => {

  shutdownLoggers(`expect:xsd`);

  it(`should enforce fixtures`, () => {
    expect(() => expectToMatchXsd(10)).
      to.throw(/must be a string/);

    expect(() => expectToMatchXsd({toto: true})).
      to.throw(/must be an instance of "Document"/);
  });

  it(`should report errored XSD`, done => {
    run(expectToMatchXsd(`coucou`), {content: ``}).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`Start tag expected`);
        done();
      }).catch(done);
  });

  it(`should report errored XML`, done => {
    run(expectToMatchXsd(`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="first-name" type="xs:string"/>
            <xs:element name="last-name" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`), {
      content: `<toto/>`
    }).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`invalid XML: Element 'toto'`);
        done();
      }).catch(done);
  });

  it(`should report invalid XML`, done => {
    run(expectToMatchXsd(`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="first-name" type="xs:string"/>
            <xs:element name="last-name" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`), {
      content: {}
    }).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`to be an instance of Document`);
        done();
      }).catch(done);
  });

  it(`should report empty XML`, done => {
    run(expectToMatchXsd(`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="first-name" type="xs:string"/>
            <xs:element name="last-name" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`), {
      content: ``
    }).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`Could not parse XML string`);
        done();
      }).catch(done);
  });

  it(`should report XSD validation errors`, done => {
    run(expectToMatchXsd(`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="first-name" type="xs:string"/>
            <xs:element name="last-name" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`), {
      content: `<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <toto>Smith</toto>
      </person>`
    }).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`element is not expected`);
        done();
      }).catch(done);
  });

  it(`should revert working dir after errors`, done => {
    const cwd = process.cwd();
    return run(expectToMatchXsd(`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:include schemaLocation="./person.xsd"/>
      <xs:element name="student">
        <xs:complexType>
          <xs:complexContent>
            <xs:extension base="Person">
              <xs:sequence>
                <xs:element name="year" type="xs:string"/>
              </xs:sequence>
            </xs:extension>
          </xs:complexContent>
        </xs:complexType>
      </xs:element>
    </xs:schema>`), {
      path: join(__dirname, `..`, `fixtures`, `schema.xsd`),
      content: `<?xml version="1.0" encoding="UTF-8"?>
      <student>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
      </student>`
    }).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(process.cwd()).to.equal(cwd);
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.include(`Missing child element(s)`);
        done();
      }).catch(done);
  });


  it(`should return libXML.js's documents`, () => {
    return run(expectToMatchXsd(`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="firstname" type="xs:string"/>
            <xs:element name="lastname" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`), {
      content: `<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
      </person>`
    }).
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

  it(`should load external XSD documents`, () => {
    return run(expectToMatchXsd(`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:include schemaLocation="./test/fixtures/person.xsd"/>
      <xs:element name="student">
        <xs:complexType>
          <xs:complexContent>
            <xs:extension base="Person">
              <xs:sequence>
                <xs:element name="year" type="xs:string"/>
              </xs:sequence>
            </xs:extension>
          </xs:complexContent>
        </xs:complexType>
      </xs:element>
    </xs:schema>`), {
      content: `<?xml version="1.0" encoding="UTF-8"?>
      <student>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
        <year>2013</year>
      </student>`
    }).
      then(result => {
        expect(result).to.be.an(`object`);
        expect(result).to.have.property(`content`).that.is.an.instanceof(libxml.Document);
        let node = result.content.get(`//student/firstname`);
        expect(node).to.exist;
        expect(node.text()).to.equals(`John`);
        node = result.content.get(`//student/lastname`);
        expect(node).to.exist;
        expect(node.text()).to.equals(`Smith`);
        node = result.content.get(`//student/year`);
        expect(node).to.exist;
        expect(node.text()).to.equals(`2013`);
      });
  });

  it(`should load external XSD documents relative to including XSD`, () => {
    return run(expectToMatchXsd(`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:include schemaLocation="./person.xsd"/>
      <xs:element name="student">
        <xs:complexType>
          <xs:complexContent>
            <xs:extension base="Person">
              <xs:sequence>
                <xs:element name="year" type="xs:string"/>
              </xs:sequence>
            </xs:extension>
          </xs:complexContent>
        </xs:complexType>
      </xs:element>
    </xs:schema>`), {
      path: join(__dirname, `..`, `fixtures`, `schema.xsd`),
      content: `<?xml version="1.0" encoding="UTF-8"?>
      <student>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
        <year>2013</year>
      </student>`
    }).
      then(result => {
        expect(result).to.be.an(`object`);
        expect(result).to.have.property(`content`).that.is.an.instanceof(libxml.Document);
        let node = result.content.get(`//student/firstname`);
        expect(node).to.exist;
        expect(node.text()).to.equals(`John`);
        node = result.content.get(`//student/lastname`);
        expect(node).to.exist;
        expect(node.text()).to.equals(`Smith`);
        node = result.content.get(`//student/year`);
        expect(node).to.exist;
        expect(node.text()).to.equals(`2013`);
      });
  });

  it(`should accept XSD as a function`, () => {
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
    return run(expectToMatchXsd(() => {
      return {content};
    }), {
      content: `<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
      </person>`
    }).
      then().
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
    return run(expectToMatchXsd(xsd), {
      content: `<?xml version="1.0" encoding="UTF-8"?>
      <person>
        <firstname>John</firstname>
        <lastname>Smith</lastname>
      </person>`
    }).
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
    const path = join(__dirname, `schema.xsd`);
    return run(expectToMatchXsd(`
    <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:element name="person">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="firstname" type="xs:string"/>
            <xs:element name="lastname" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>`), {
      content,
      path
    }).
      then(result => {
        expect(result).to.be.an(`object`);
        expect(result).to.have.property(`content`).that.equals(content);
        expect(result).to.have.property(`path`).that.equals(path);
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
    run(expectToMatchXsd(xsd), {
      content,
      _ctx: {stack}
    }).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equals(`\nwhen ${stack.join('\nthen ')}\ninvalid XML: Element 'firstname': This element is not expected. Expected is ( first-name ).`);
        done();
      }).catch(done);
  });
});
