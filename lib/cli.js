#!/usr/bin/env node
'use strict';

const program = require('commander');
const desc = require('../package.json');
const run = require('./run');

program.
  version(desc.version).
  command('run').
  option('-r, --reporter [reporter]', 'set reporter used to display test results [spec]', 'spec').
  description('run your integration tests').
  action(run);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
