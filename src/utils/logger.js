'use strict';

const moment = require(`moment`);
const chalk = require(`chalk`);
const ini = require(`ini`);
const path = require(`path`);
const fs = require(`fs`);

// Created loggers cache
const loggers = {};

// Acceptable levels and colors
const levels = {
  all: {threshold: 0},
  debug: {threshold: 1, color: `blue`},
  info: {threshold: 2, color: `green`},
  warn: {threshold: 3, color: `yellow`},
  error: {threshold: 4, color: `red`},
  off: {threshold: 5}
};

// Current configuration obejct
let configuration = {};

/**
 * Limits a string to a maximum number of character, addind an horizontal ellipsis
 * if needed.
 * If string is shorter thatn the maximum size, right padd it with spaces
 * @param {String} str - truncated/padded string.
 * @param {Number} max - maximum length expected
 * @return {String} the truncated/padded version of str.
 */
const padd = (str, max) => {
  if (str.length > max) {
    str = `${str.substr(0, max - 1)}\u2026`;
  } else if (str.length < max) {
    str = Array.from({length: max - str.length}, () => ` `).join(``) + str;
  }
  return str;
};

/**
 * Reads the configuration file.
 * Updates global configuration, and also existing loggers.
 *
 * @param {String} confPath - absolute or relative path to configuration file
 * @param {Boolean} sync = false - true to read configuration synchronously
 * @returns {Promise<Object>} fulfilled with the configuration object.
 */
const reloadConf = (confPath, sync) =>
  new Promise((resolve, reject) => {
    confPath = path.resolve(confPath);

    const processContent = (err, content) => {
      if (err) {
        // no file ? no conf, no problem
        if (err.message.indexOf(`ENOENT`) !== -1) {
          return resolve({});
        }
        return reject(err);
      }
      resolve(ini.decode(content.toString('utf8')));
    };

    if (sync) {
      processContent(null, fs.readFileSync(confPath));
    } else {
      fs.readFile(confPath, processContent);
    }
  }).
  then(conf => configuration = conf).
  then(conf => {
    // tries to update existing loggers
    for (let name in loggers) {
      if (conf[name] && conf[name].level) {
        loggers[name].level = conf[name].level;
      }
    }
  });

/**
 * Print a trace with the specified logger name, and the maximum threshold.
 * Preprend print timestamp
 *
 * @param {String} levelName - current level of the trace
 * @param {String} loggername - name of the logger used
 * @param {Numer} threshold - limit bellow which the trace is ignored
 * @param {Array} args - trace arguments, as an array
 */
const printLog = (levelName, loggername, threshold, args) => {
  if (levels[levelName].threshold < threshold) {
    return;
  }
  args.unshift(
    // adds timestamp
    chalk.grey(moment().format(`YYYYMMDD HH:mm:ss SSS`)),
    // logger name (padd to 10) and level (padd to 5 and colorized)
    chalk.grey(`${padd(loggername, 10)} [${chalk[levels[levelName].color](padd(levelName, 5))}] -`)
  );
  /* eslint no-console: 0 */
  console.log.apply(console, args);
};


/**
 * Logger class.
 * functions named after levels will be added to prototype.
 */
class Logger {
  constructor(name, level) {
    this.name = name;
    this.level = level;
  }
}

// Add method to Logger's prototype
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

// Initialize configuration, synchronously
let confPath = path.resolve(`logging.properties`);

reloadConf(confPath, true);
// And start a watcher on parent folder (more reliable than watchFile)
fs.watch(path.dirname(confPath), {persistent: false}, (evt, filename) => {
  if (filename && filename === path.basename(confPath)) {
    reloadConf(confPath);
  }
});

/**
 * Logger factory.
 * Builds a new logger (default level to debug) or reused already created instance.
 *
 * @param {String} name - of the expected logger
 * @return {Logger} the created (or reused) instance
 */
module.exports = name => {
  if (!(name in loggers)) {
    loggers[name] = new Logger(name, (configuration[name] && configuration[name].level) || `debug`);
  }
  return loggers[name];
};
