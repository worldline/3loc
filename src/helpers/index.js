'use strict';

const fs = require(`fs`);
const _ = require(`lodash`);

// export all available helpers as camelCase equivalent (validate-xml > validateXml)
fs.readdirSync(__dirname).filter(file => file !== `index.js`).forEach(file =>
  exports[_.camelCase(file.replace(/\.js$/, ``))] = require(`./${file}`)
);

// adds lodash chaining functions as helpers

const unusable = [`VERSION`];

for (let method in _) {
  if (unusable.indexOf(method) === -1) {
    exports[method] = function() {
      return _[method].apply(_, arguments);
    };
  }
}
