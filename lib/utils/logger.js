'use strict';

const moment = require(`moment`);
const chalk = require(`chalk`);

const loggers = {};

const levels = {
  all: {threshold: 0},
  debug: {threshold: 1, color: `blue`},
  info: {threshold: 2, color: `green`},
  warn: {threshold: 3, color: `yellow`},
  error: {threshold: 4, color: `red`},
  off: {threshold: 5}
};

class Logger {
  constructor(name, level) {
    this.name = name;
    this.level = level;
  }
}

const padd = (str, max) => {
  if (str.length > max) {
    str = `${str.substr(0, max - 1)}…`;
  } else if (str.length < max) {
    str = Array.from({length: max - str.length}, () => ` `).join(``) + str;
  }
  return str;
};

const printLog = (levelName, logger, threshold, args) => {
  if (levels[levelName].threshold < threshold) {
    return;
  }
  args.unshift(
    // adds timestamp
    chalk.grey(moment().format(`YYYYMMDD HH:mm:ss SSS`)),
    // logger name (padd to 10) and level (padd to 5 and colorized)
    chalk.grey(`${padd(logger, 10)} [${chalk[levels[levelName].color](padd(levelName, 5))}] -`)
  );
  /* eslint no-console: 0 */
  console.log.apply(console, args);
};

for (let level in levels) {
  Logger.prototype[level] = function() {
    let args = [];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    printLog(level, this.name, (levels[this.level] || levels.all).threshold, args);
  };
}

Logger.prototype.log = Logger.prototype.debug;


const getLogger = name => {
  if (!(name in loggers)) {
    loggers[name] = new Logger(name, `debug`);
  }
  return loggers[name];
};

module.exports = getLogger;
