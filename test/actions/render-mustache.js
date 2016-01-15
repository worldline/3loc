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

  it(`should render template with`, () => {
    const data = {name: `Damien`, polite: true};
    return render({
      content: `Hello {{name}}{{#polite}}, nice to meet you{{/polite}}.`,
      data
    }).
      then(result => {
        expect(result).to.have.property(`content`).that.equals(`Hello Damien, nice to meet you.`);
        expect(result).to.have.property(`data`).that.equals(data);
      });
  });

  it(`should render template without data`, () => {
    return render({
      content: `Hello !`
    }).
      then(result => {
        expect(result).to.have.property(`content`).that.equals(`Hello !`);
        expect(result).not.to.have.property(`path`);
        expect(result).not.to.have.property(`data`);
      });
  });

  it(`should propagate context`, () => {
    return render({content: `Hello !`, path: `somewhere.js`}).
      then(result => {
        expect(result).to.have.deep.property(`_ctx.stack`).that.has.length(1);
        expect(result._ctx.stack[0]).to.equals(`render template somewhere.js`);
        return result;
      }).
      then(result => {
        delete result.path;
        result.content = `Hi !`;
        return render(result);
      }).
      then(result => {
        expect(result).to.have.deep.property(`_ctx.stack`).that.has.length(2);
        expect(result._ctx.stack[1]).to.equals(`render template`);
      });
  });
});
