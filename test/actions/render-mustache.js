'use strict';

const expect = require(`chai`).expect;
const render = require(`../../src/actions/render-mustache`);

describe(`Mustache rendering action`, () => {

  it(`should enforce fixtures`, () => {
    // content
    expect(() => render({
    })).to.throw(/"content" is required/);

    expect(() => render({
      content: true
    })).to.throw(/must be a string/);

    // data
    expect(() => render({
      content: `!`,
      data: true
    })).to.throw(/must be an object/);
  });

  it(`should report invalid template`, done => {
    render({content: 'hello {{/unknown}}'}).
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.include(`Closing tag without opener`);
        done();
      }).catch(done);
  });

  it(`should render template`, () => {
    return render({
      content: `Hello {{name}}{{#polite}}, nice to meet you{{/polite}}.`,
      data: {name: 'Damien', polite: true}
    }).
      then(result => {
        expect(result).to.have.property(`content`).that.equals(`Hello Damien, nice to meet you.`);
      });
  });

  it(`should render template without data`, () => {
    return render({
      content: `Hello !`
    }).
      then(result => {
        expect(result).to.have.property(`content`).that.equals(`Hello !`);
      });
  });
});
