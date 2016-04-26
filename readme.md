# 3loc

A simple-yet-customizable integration test tool:

0. Choose/write a test scenrio for your integration tests
0. Writes our test fixtures into one or several CSV/YAML files
0. Run the command and enjoy the results !

## Principles

3loc runs tests against existing system, sending input and expecting results.
If received results are not the one expected, it will complain.

It's focused on Http services, SOAP and REST.

Test scenarii are basically JavaScript files, containing a series of *[actions][act]* and *[expectations][expect]*.
You will surely need to run the same scenario multiple times, with slight changes in the test data: body sent to the tested WebService, or expected status code.

We called them *[fixtures][fixt]*, and you can externalize them in a dedicated file (multiple format are supported).
In fact, the fixture file is the entry point when using 3loc, as it defined the scenario file used.

## Installation

3loc is built upon [Node.js 4+][node].
You'll need to install it on your computer to use it.

As 3loc uses [libXML.js][libxml], which requires some C++ compilation, you'll also need a C++ compiler
(gcc or [Visual Studio Community Edition][VS] for example).

Once you have installed Node and a C++ compiler, run the following command to install

    npm install --global 3loc

(then have a cup of coffee)

## Execution

From a command line or a terminal, run

    run path/to/fixture.yml

CLI options are documented:

    run


# Providing test fixtures

Test fixtures are used to add some dynamicity to your scenario files.
This is an example:

```javascript
return () =>
    run(request({
      url: 'http://api.wolframalpha.com/v2/query?input=<$ input $>&appid=<$ appId $>&includepodid=Result'
    })).
    then(expectStatusCode(<$ status $>)).
    then(expectXPathToEqual('//pod[id="Result"]//plaintext', '<$ sum $>'));
```

It makes an Http call to the [Wolfram API][wolfram], get and parse the XML content,
checks the received status code and check the result with an XPath expression.

See those `<$ $>` placeholders (`input`, `sum`...) ? they are replaced with the provided test data.


## With YAML

YAML is probably the best choice to write your fixtures.
Here is the YAML file for the above scenario:
```yaml
scenario: ./path_to/my-scenario.scn
appId: HLJL66-4W3HPXYYP8
tests:
  - name: nominal case
    timeout: 3000
    input: 3%2B4
    sum: 7
    status: 200
  - name: handling nulls
    input: 3%2Bnull
    sum: 3
    status: 200
```

`scenario` is the path the the scenario file (required).

`tests` is an array of objects, each considered as the specific fixtures of a given test.
If 3loc find two objects in `tests`, it will runs the scenario twice, using the given objects.

Inside `tests` and in root level, you can put anything, from simple string/boolean to complex array/map structures.

The content will be used inside the scenario file:
- `input`, `sum` and `status` are defined at test levels
- `appId` is common to all tests (but can be overloaded per test)

If you specify a `name` at test level, it will be used in final report.
Otherwise, a name with test number will be generated.

You can also provide a test-specific timeout (in millisecond, default to 2000).


You can't use different scenarii for each test. If you whish, write different fixtures files.

Last but not least, a YAML file can include other YAML files, using the following *macro*:
```yaml
config: !!inc/file configuration.yaml
```

The `!!inc/file` performs a *synchronous* read of the given path (relative to the including file) and is replaced by its content.


## With CSV

Less flexible than YAML, it suits some cases where data is mearly flat, does not share a lot of data, and when you want diffent scenarii.
The CSV fixtures for the above scenario is:
```csv
scenario;name;appId;input;sum;status
./path_to/my-scenario.scn;HLJL66-4W3HPXYYP8;"nominal case";3%2B4;7;200
./path_to/my-scenario.scn;HLJL66-4W3HPXYYP8;"handling nulls";3%2Bnull;3;200
```

Each line will execute a different test.
`scenario` column contains the path the the scenario file (required).

Any other column contains data used inside test.
If you put dots in the column name, the data replace will be treeish.
For example, with a column named `host.url`, the replacement will be `request({host: '<$ host.url $>'})`
and the data is an `host` object containing an `url` property.

If you specify a `name` column, it will be used in final report.
Otherwise, a name with test number will be generated.

You can also set a `timeout` column to customize tests timeout (in millisecond, default to 2000).

You can't share data among different tests. For that, please use a YAML fixture file.


## Common considerations

Whatever the format used, the following considerations always apply:
- `scenario` path is always relative to the fixture location (you can provide absolute path as well)
- `scenario` can directly contains the JavaScript code (only suit really tiny scenarii)
- Tests are executed serially: the program bails at first error
- Test execution folder is always the folder containing the scenario file.
  Data used as path (`load` action for example) are relative to that folder
- When providing scenario content directly, the execution folder is the one containing the fixture file


# Logging

By default, 3loc is not really verbose.
But it can be more chatty if you configure logging: just put a `logging.properties` file in the execution folder.

The file syntax is a classical [INI][ini] file where the category is the logger name, and the values allows to customize its parameter:
```properties
[my-logger-1]
level=error

[my-logger-2]
level=debug
```

The conf is regularly watched so you can change you file while 3loc is running.

By convention, each actions/expectation uses its own logger, so you can have a fine-grained tunning.


# Scenario authoring

Scenario files are JavaScript files, templated with [Nunjucks][nunjucks] template language.

Obviously they must be well-formed JavaScript **after** the template compilation.

## Templating

To improve readability, the default Nunjucks's delimiter have been **changed**:
- blockStart: '<%'
- blockEnd: '%>'
- variableStart: '<$'
- variableEnd: '$>'
- commentStart: '<#'
- commentEnd: '#>'

Be warned that placeholders **are type-aware** (which is an improvment of Nunjuck behavior).
For example this scenario:
```javascript
load(<$ file $>)
```
It will compiles only if you provides a string value in the fixture file.

Boolean and number types are kepts within templates,
strings fixtures are automatically enclosed in double quotes,
arrays and objects are serialized into JSON.

All methods from [lodash v4.0.1][lodash] are also available as Nunjuck filters:
```javascript
run(request(<$ endpoint | pick('url', 'headers') $>)).
  then(expectContentToInclude(<$ filename | camelCase $>))
```

The first method parameter is always the filtered values, and you can add extra parameters.
It's strictly equivalent to write:
var _ = require('lodash');
```javascript
run(request(_.pick(<$ endpoint $>, 'url', 'headers'))).
  then(expectContentToInclude(_.camelCase(<$ filename $>)))
```

You can also hardcode everything, and in that case, the fixtures file only needs to specify scenario path and a name for each tests.

## Returning the proper thing

Your scenario file must ends by returning either:
- A Promise. ex: `return Promise.resolve(18);`
- A synchronous function. ex `return function() { return 18; };`
- An asynchronous function. ex `return function(done) { require('fs').readFile('myfile.txt', done); };`
  (asynchronous functions differs from synchronous function because they declare a single argument)

The best thing to do is to return the result of [run()](#run) or [runSerial()](#runSerial) actions.

## It's just JavaScript

And it's executed on Node.js.
That means that Node's API are available (through the use of `require()` function),
as well as 3loc own dependencies ([lodash](https://lodash.com/), [moment](http://momentjs.com/), [chai](http://chaijs.com/), [joi](https://github.com/hapijs/joi)...)

As your tests are run on Node.js, you can use the ES6 features supported from version 4.2
(arrow functions, promises, string interpolation, classes...).

# Available actions

All actions are JavaScript functions automatically available within scenario file (no need to require anything else).
They are composable within [Promises][promise], and are intended to be used that way.

Do *NOT* handle promise rejections, unless your scenario needs to keep testing stuff after an error.
The nominal case is to let errors bubnle an stop the current executed test.

## listen

Starts an HTTP server to listen a given url.
Acceptable method can be configured, has well as response body and headers.

If a JSON body is passed, set default response content-type to `application/json`.
If a libXML.js Document body is pased, set default response content-type to `application/xml`.
You can still override the response content-type if needed.

If body is given as a function, it must return a promise fulfilled
with an object including a `content` property.

Request body will be automatically parsed (using the request content-type) to libXML.js Document or to JSON object for further processing.
Otherwise, the request body is passed as a string.

```javascript
listen({
  port: 4000,
  url: '/my-api',
  method: 'POST',
  body: '{"msg": "response sent"}',
  headers: {
    'content-type': 'application/json',
    'x-custom': 'custom'
  },
  code: 200
}).then(...)

```
- **opt.port** *{Number}* - absolute or relative path to read file
- **opt.url** *{String}* - acceptable url to listen to
- **opt.method = GET** *{String}* - acceptable Http method
- **opt.body = ''** *{String|Object|Document|Function}* - response sent to incoming request
- **opt.headers = {}** *{Object}* - response headers sent to incoming request
- **opt.code = 200** *{Number}* - status code sent to incoming request
- **returns** *{Function}* function usable in promises chain.
  Takes as first parameter an object.
  Returns a promise fulfilled with the same object, containing
  - **content** *{String}* - response body received (might be parsed in JSON/XML)
  - **headers** *{Object}* - response headers

Logger name: `act:listen`

## load

Loads file content as a string.
Typically used to read request/response bodies, XSD files...

```javascript
load('./path_to/file.txt', 'ascii').then(...)
```

- **path** *{String}* - absolute or relative path to read file
- **encoding = utf8** *{String}* - encoding used to read the file
- **returns** *{Function}* function that loads the file when invoked.
  Takes as first parameter an object.
  Returns a promise fulfilled with the same object, containing
  - **content** *{String}* - response body received (might be parsed in JSON/XML)
  - **path** *{Object}* - absolute or relative path to read file

Logger name: `act:load`

## render

Renders Nunjucks template with given data.
See [Nunjucks][nunjucks] templating language,
with the specific delimiters (for readability in scenarii files)
- blockStart: '<%',
- blockEnd: '%>',
- variableStart: '<$',
- variableEnd: '$>',
- commentStart: '<#',
- commentEnd: '#>'

```javascript
render('Hello <$ name $> !', {name: 'James'}).then(...)
```

If content is given as a function, it must return a promise fulfilled
with an object including a `content` and `path` properties.

- **content** *{String|Function}* - template rendered
- **data = {}** *{Object}* - data used for rendering
- **returns** *{Function}* function usable in promises chain.
  Takes as first parameter an object
  Returns a promise fulfilled with the same object, containing
  - **content** *{String}* - the rendered template

Logger name: `act:render`

## request

Makes an HTTP(s) request on a given url.
The HTTP method, the headers and the ability to follow redirections are configurable.

If a JSON body is passed, set default request content-type to 'application/json'.
If a libXML.js Document body is pased, set default request content-type to 'application/xml'.
You can still override the request content-type if needed.

Request body will be automatically parsed (using the request content-type) to libXML.js Document or to JSON object for further processing.
Otherwise, the request body is passed as a string.

```javascript
request({
  url: 'http://localhost:8080/my-api',
  method: 'PUT',
  body: '{"msg": "request sent"}',
  headers: {
    'content-type': 'application/json',
    'x-custom': 'custom'
  },
  followRedirect: true
}).then(...)
```

If you need to pass query parameters, please encode them with the url.

If body is given as a function, it must return a promise fulfilled
with an object including a `content` property.

- **opt.url** *{String}* - full url (protocol, host, port, path) requested
- **opt.method = GET** *{String}* - method used
- **opt.body = ''** *{String|Object|Document}* - body sent (only when doing POST and PUT)
- **opt.headers = {}** *{Object}* - request headers
- **opt.followRedirect = false** *{Boolean}* - automatically follows redirection
- **returns** *{Function}* function usable in promises chain.
  Takes as first parameter an object.
  Returns a promise fulfilled with the same object, containing
  - **content** *{String}* - response body received (might be parsed in JSON/XML)
  - **headers** *{Object}* - response headers
  - **code** *{Number}* - http status code

Logger name: `act:request`

## run

Runs synchronously a given function, with provided data, and wrap to
Promise for next actions and expectations.
A must-have when starting a new scenario.

```javascript
run(request({url: 'http://somewhere.com/'}))
```

- **fs** *{Function}* - function executed
- **data = {}** *{Object}* - optionnal data given as function argument

- **returns** *{Promise}* fulfilled with the function result

Logger name: `act:run`

## runSerial

Runs an array of function serially,
passing result of task N as parameter of task N+1.

Beware that you must pass an array **functions**.
Don't give promises, or they will be started all in once.

```javascript
runSerial([
  () => Promise.resolve(1),
  p => Promise.resolve(p + 1)
].then(result => ...) // result === 2
```

- **tasks** *{Array<Function>}* - tasks to be executed
- **returns** *{Function}* that when invoked, will return promise fulfilled
with the latest task's result

Logger name: `act:serial`


# Expectations

All actions are JavaScript functions automatically available within scenario file (no need to require anything else).
They are composable within [Promises][promise], and are intended to be used that way.

Do *NOT* handle promise rejections, unless your scenario needs to keep testing stuff after an error.
The nominal case is to let errors bubnle an stop the current executed test.

## expectContentToInclude

Checks that received content includes the given element,
or matches the given pattern.

```javascript
run(load('my-file.txt')).
then(expectcontentToInclude('Hi !'))
```

- **element** *{String|Regex}* - expected element or matching pattern
- **returns** *{Function}* function usable in promises chain
  Takes as first parameter an object containing
  - **content** *{Object}* - checked content
  - **returns** *{Promise}* fulfilled with the same object

Logger name: `expect:content`

## expectStatusCode

Checks that a given status code has been received.

```javascript
run(request({'http://somewhere.com/api'})).
then(expectStatusCode(404))
```

- **code** *{Number}* - expected value
- **returns** *{Function}* function usable in promises chain
  Takes as first parameter an object containing
  - **code** *{Object}* - checked code value
  - **returns** *{Promise}* fulfilled with the same object

Logger name: `expect:status`

## expectToMatchXsd

Validates incoming content against a given XSD content.
Use libXML.js internally.
XSD and XML content can be passed as plain string, or as libXML.js's Document objects

If xsd is given as a function, it must return a promise fulfilled
with an object including a `content` property.

```javascript
run(request({'http://somewhere.com/api'})).
then(expectToMatchXsd(load('schema.xsd')))
```

- **xsd** *{String|Object|Function}* - xsd content used for validation
- **returns** *{Function}* function usable in promises chain.
  Takes as first parameter an object containing
  - **content** *{String|Object}* - xml content validated
  - **returns** *{Promise}* fulfilled with the same object, where content has been enriched as a libXML.js's Document

Logger name: `expect:xsd`

[node]: https://nodejs.org/en/download/
[act]: #available-actions
[expect]: #expectations
[fixt]: #providing-test-fixtures
[wolfram]: http://www.wolfram.com/language/fast-introduction-for-programmers
[nunjucks]: http://mozilla.github.io/nunjucks/templating.html
[promise]: http://www.html5rocks.com/en/tutorials/es6/promises/
[VS]: https://www.visualstudio.com/en-US/products/visual-studio-community-vs.aspx
[libxml]: https://github.com/polotek/libxmljs/wiki
[lodash]: https://lodash.com/docs
[ini]: https://en.wikipedia.org/wiki/INI_file