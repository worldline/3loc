'use strict';

const fs = require(`fs`);
const path = require(`path`);
const yaml = require(`js-yaml`);
const _ = require(`lodash`);
const Test = require(`../engine/test`);
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
    const specDir = path.dirname(fullpath);
    // extract content with YAML parser + our custom inclusion YAML type
    const spec = yaml.safeLoad(content, {schema: declareSchema(specDir)});
    // validates spec class name existence
    if (!spec.scenario) {
      throw new Error(`Missing scenario in ${filename}`);
    }
    let result = [];

    // scenario dir is relative to spec dir
    const scenarioDir = path.resolve(specDir, path.dirname(spec.scenario));
    fs.exists(scenarioDir, dirExist => {
      // test working dir will be relative to scenario file, or the spec file if we directly have scenario content
      const workdir = dirExist ? scenarioDir : specDir;

      // make scenario an absolute path if it's not directely the scenario content
      let scenario = dirExist ? path.resolve(specDir, spec.scenario) : spec.scenario;
      fs.exists(scenario, scenarioExist => {
        scenario = scenarioExist ? scenario : spec.scenario;

        // read common fixtures (everything but 'scenario' and 'tests')
        const common = _.omit(spec, `scenario`, `tests`);

        if (Array.isArray(spec.tests)) {
          result = spec.tests.map((fixture, i) => {
            let name = fixture.name || `test ${i + 1}`;
            // creates scenario with common values, but possibility to be specific overloaded
            return new Test(name, scenario, _.merge({}, common, _.omit(fixture, `name`)), workdir);
          });
        }
        resolve(result);
      });
    });
  });

/**
 * Reads spec file and return an array of test cases
 * Incoming yaml must contain a Map with keys:
 * - scenario {String} - path to scenario used for this test
 * - tests {Array<Object>} - list of tests to be run. Each test is a fixtures given to the
 *
 * Scenario instance. If 'name' is present in test, it's extracted. Otherwise it's generated
 * All other properties at root are considered to be common fixtures to each tests.
 * All properties under test are considered as specific fixtures, that overloads common ones.
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
