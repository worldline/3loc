'use strict';

const fs = require(`fs`);
const path = require(`path`);
const yaml = require(`js-yaml`);
const _ = require(`lodash`);
const getType = require(`../utils/object`).getType;


/**
 * Creates a YAML schema extending js-yaml.DEFAULT_SAFE_SCHEMA,
 * freely inspired from https://github.com/claylo/yaml-include,
 * but with the support of relative file loading
 *
 * @param {String} root - absolute path from which all included file are relative
 * @return {yaml.Schema} the creates Schema including custom inclusion type
 * @see https://github.com/nodeca/js-yaml#safeload-string---options-
 */
const declareSchema = root => {
  // early declare because of the circular nature or includeType/inclusionSchema
  let inclusionSchema;

  // A YAML custom type that SYNCHRONOUSLY loads external file content
  const includeType = new yaml.Type(`tag:yaml.org,2002:inc/file`, {
    kind: `scalar`,
    resolve: data => getType(data) === 'string',
    construct: data =>
      yaml.safeLoad(fs.readFileSync(path.resolve(root, data), 'utf8'), {
        schema: inclusionSchema,
        filename: path.basename(data)
      })
  });

  // A schema that allows file inclustion within YAML
  inclusionSchema = new yaml.Schema({
    include: [yaml.DEFAULT_SAFE_SCHEMA],
    explicit: [includeType]
  });

  return inclusionSchema;
};

/**
 * Parse incoming file content into an array of test cases
 *
 * @param {String} fullpath - YAML file absolute path
 * @param {String} content - parsed file content
 * @return {Promise<Array<Scenario>>} promise resolved with the array of parsed test specifications
 */
const parseFile = (fullpath, content) =>
  new Promise(resolve => {
    const filename = path.basename(fullpath);
    // extract content with YAML parser + our custom inclusion YAML type
    const spec = yaml.safeLoad(content, {schema: declareSchema(path.dirname(fullpath))});
    // validates spec class name existence
    if (!spec.scenario) {
      throw new Error(`${filename} does not include scenario id`);
    }
    try {
      const Scenario = require(`../scenario/${spec.scenario}`);
      let result = [];

      // read common fixtures (everything but 'scenario' and 'tests')
      const common = _.omit(spec, `scenario`, `tests`);

      if (Array.isArray(spec.tests)) {
        result = spec.tests.map((fixture, i) => {
          let name = fixture[Scenario.nameProperty] || `test ${i + 1}`;
          // creates scenario with common values, but possibility to be specific overloaded
          return new Scenario(name, _.merge({}, common, _.omit(fixture, Scenario.nameProperty)));
        });
      }
      resolve(result);
    } catch (exc) {
      throw new Error(`${spec.scenario} is not a known scenario`);
    }
  });

/**
 * Reads spec file and return an array of test cases
 * Incoming yaml must contain a Map with keys:
 * - scenario {String} - case-sensitive name of the scenario used (in src/scenario folder)
 * - tests {Array<Object>} - list of tests to be run. Each test is a fixtures given to the
 * Scenario instance. Depending on the Scenario, a test name is extracted or generated
 *
 * @param {String} spec - full or relative path to spec YAML file
 * @return {Promise<Array<Scenario>>} resolved with the read scenarii as parameter
 */
module.exports = spec => {
  return new Promise((resolve, reject) => {
    spec = path.resolve(spec);
    // opens the specified file as utf8
    fs.readFile(spec, {encoding: `utf8`}, (err, content) => {
      if (err) {
        return reject(err);
      }
      // parsing might throw exception that will reject promise
      resolve(parseFile(spec, content));
    });
  });
};
