'use strict';

const gulp = require('gulp');
const log = require('gulp-util').log;
const eslint = require('gulp-eslint');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');

// Single path declarations
const paths = {
  sources: ['./lib/**/*.js'],
  tests: './test/**/*.js'
};

const mochaOpts = {
  reporter: 'spec'
};

const coverageThresholds = {
  thresholds: {
    global: 90
  }
}

// For linting, we may want to stop build on errors, or not
const makeLint = (fail) =>
  () => {
    let stream = gulp.src(paths.sources.concat([paths.tests])).
      pipe(eslint()).
      pipe(eslint.format());
    if (fail) {
      stream = stream.pipe(eslint.failAfterError());
    }
    return stream;
  };

// Lint sources with esLint
gulp.task('lint', makeLint(true));
gulp.task('lint-nofail', makeLint(false));

// Instrument code before testing for coverage
const makePreTest = (fail) =>
  () => {
    let stream = gulp.src(paths.sources).
      pipe(istanbul());
    if (!fail) {
      stream = stream.on('error', err => {
        log('Failed to instrument: %s', err);
        stream.emit('end');
      });
    }
    return stream.pipe(istanbul.hookRequire());
  };

gulp.task('pre-test', ['lint'], makePreTest(true));
gulp.task('pre-test-nofail', ['lint-nofail'], makePreTest(false));

// For tests, we may want to stop build on errors, or not
const makeTest = (fail, prefix) =>
  () => {
    if (prefix) {
      log(prefix);
    }
    process.env.NODE_ENV = 'test';
    let mochaStream = mocha(mochaOpts);
    if (!fail) {
      mochaStream = mochaStream.on('error', () => {});
    }
    let stream = gulp.src(paths.tests, {read: false}).
      pipe(mochaStream);
    if (!fail) {
      stream = stream.on('error', err => {
        log('Failed test with error %s', err);
        stream.emit('end');
      });
    }
    stream = stream.pipe(istanbul.writeReports()).
      pipe(istanbul.enforceThresholds(coverageThresholds));
    if (!fail) {
      stream = stream.on('error', () => {});
    }
    return stream;
  };

// Test tasks, entierly relying on mocha + istanbull (for coverage)
gulp.task('test', ['pre-test'], makeTest(true));
gulp.task('test-nofail', ['pre-test-nofail'], makeTest(false, '\n\n\n--- New run'));

gulp.task('default', () =>
  gulp.watch(paths.sources.concat([paths.tests]), ['test-nofail'])
);
