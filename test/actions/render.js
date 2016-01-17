'use strict';

const expect = require(`chai`).expect;
const render = require(`../../src/actions/render`);

describe(`Nunjucks rendering action`, () => {

  it(`should enforce fixtures`, () => {
    // content
    expect(render).to.throw(/"value" is required/);

    expect(() => render(true)).to.throw(/must be a string/);
  });

  it(`should report invalid template`, done => {
    render('hello <% endfor %>').
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.include(`unknown block tag`);
        done();
      }).catch(done);
  });

  it(`should report missing replacment`, done => {
    render('hello <$ name $>').
      then(() => done(`should have failed !`)).
      catch(err => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.include(`attempted to output null or undefined value`);
        done();
      }).catch(done);
  });

  it(`should render template with data`, () => {
    const data = {name: `Damien`, polite: true};
    return Promise.resolve({data}).
      then(render(`Hello <$ name $><% if polite %>, nice to meet you<% endif %>.`)).
      then(result => {
        expect(result).to.have.property(`content`).that.equals(`Hello Damien, nice to meet you.`);
      });
  });

  it(`should render template without data`, () => {
    return render(`Hello !`).
      then(result => {
        expect(result).to.have.property(`content`).that.equals(`Hello !`);
      });
  });

  it(`should accept content from Promise`, () => {
    return render(Promise.resolve({content: `Bonjour !`})).
      then(result => {
        expect(result).to.have.property(`content`).that.equals(`Bonjour !`);
      });
  });

  it(`should propagate context`, () => {
    return Promise.resolve({path: `req1.txt`}).
      then(render(`Hello !`)).
      then(result => {
        expect(result).to.have.deep.property(`_ctx.stack`).that.has.length(1);
        expect(result._ctx.stack[0]).to.equals(`render template req1.txt`);
        delete result.path;
        return result;
      }).
      then(render(`Hi !`)).
      then(result => {
        expect(result).to.have.deep.property(`_ctx.stack`).that.has.length(2);
        expect(result._ctx.stack[1]).to.equals(`render template`);
      });
  });
});
