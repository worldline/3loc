'use strict';

const fs = require(`fs`);
const _ = require(`lodash`);

// export all available actions as camelCase equivalent (validate-xml > validateXml)
fs.readdirSync(__dirname).filter(file => file !== `index.js`).forEach(file =>
  exports[_.camelCase(file.replace(/\.js$/, ``))] = require(`./${file}`)
);
