'use-strict';

const common = require('./common.js');
const error = common.error;

const defaultOptions = Object.freeze({
  enabled: true,
  position: 'plugin',
  minify: false
});
const errorMsg = 'invalid args - please see https://github.com/numical/style-ext-html-webpack-plugin for configuration options';

const hasProperty = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

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
      if (hasProperty(options, 'enabled')) {
        denormalised.enabled = options.enabled;
      }
      if (hasProperty(options, 'file')) {
        denormalised.cssFilename = options.file;
      }
      if (hasProperty(options, 'chunks')) {
        denormalised.chunks = options.chunks;
      }
      if (hasProperty(options, 'position')) {
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
      if (hasProperty(options, 'minify')) {
        if (options.minify === true) {
          denormalised.minify = {};
        } else {
          denormalised.minify = options.minify;
        }
      }
      if (hasProperty(options, 'cssRegExp')) {
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
