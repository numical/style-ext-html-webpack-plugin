'use-strict';

const common = require('./common.js');
const error = common.error;

const defaultOptions = Object.freeze({
  enabled: true,
  position: 'plugin',
  minify: false
});
const errorMsg = 'invalid args - please see https://github.com/numical/style-ext-html-webpack-plugin for configuration options';

const denormaliseOptions = options => {
  const denormalised = Object.assign({}, defaultOptions);

  switch (typeof options) {
    case 'undefined':
      break;
    case 'boolean':
      denormalised.enabled = options;
      break;
    case 'string':
      denormalised.enabled = true;
      denormalised.cssFilename = options;
      break;
    case 'object':
      if (options.hasOwnProperty('enabled')) {
        denormalised.enabled = options.enabled;
      }
      if (options.hasOwnProperty('file')) {
        denormalised.cssFilename = options.file;
      }
      if (options.hasOwnProperty('chunks')) {
        denormalised.chunks = options.chunks;
      }
      if (options.hasOwnProperty('position')) {
        denormalised.position = options.position;
        switch (denormalised.position) {
          case 'plugin':
          case 'head-top':
          case 'head-bottom':
          case 'body-top':
          case 'body-bottom':
            break;
          default:
            error(errorMsg);
        }
      }
      if (options.hasOwnProperty('minify')) {
        if (options.minify === true) {
          denormalised.minify = {};
        } else {
          denormalised.minify = options.minify;
        }
      }
      if (options.hasOwnProperty('cssRegExp')) {
        denormalised.cssRegExp = options.cssRegExp;
      }
      break;
    default:
      error(errorMsg);
  }
  return denormalised;
};

module.exports = denormaliseOptions;
module.exports.defaultOptions = defaultOptions;
