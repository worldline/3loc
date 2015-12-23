#!/usr/bin/env node
'use strict';

const program = require(`commander`);
const run = require(`./utils/cli-run`);
const desc = require(`../package.json`);

program.
  version(desc.version).
  arguments(`<spec>`).
  option(`-r, --reporter [reporter]`, `set reporter used to display test results [spec]`, `spec`).
  description(`run your integration tests defined into <spec> CSV file`).
  action(run);

program.parse(process.argv);

// force help to have the proper cli name
/* eslint no-underscore-dangle: 0 */
program._name = desc.name;

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
