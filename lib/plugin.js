'use strict';

const debug = require('debug')('StyleExt');

const V2_CONFIG_DETECTED = 'StyleExtHtmlWebpackPlugin legacy configuration detected - please see https://github.com/numical/style-ext-html-webpack-plugin for how to configure v3.x+';
const CSS_FILE_NOT_FOUND = 'StyleExtHtmlWebpackPlugin could not find ExtractTextWebpackPlugin\'s generated .css file';

const EVENT = 'html-webpack-plugin-alter-asset-tags';
const CSS_REGEX = /\.css$/;

const cssRegexMatch = function (filename) {
  if (CSS_REGEX.test(filename)) {
    this.cssFilename = filename;
    return true;
  }
};

const validateFilename = function (assets) {
  const filenames = Object.keys(assets);
  return (this.cssFilename)
    ? filenames.indexOf(this.cssFilename) > -1
    : filenames.some(cssRegexMatch.bind(this));
};

const isStyleLinkTag = (tagDefinition, stylePath) => {
  if (!tagDefinition) return false;
  if (tagDefinition.tagName !== 'link') return false;
  if (!tagDefinition.attributes) return false;
  if (!tagDefinition.attributes.href) return false;
  if (tagDefinition.attributes.href !== stylePath) return false;
  debug(`${EVENT}: link element found for style path '${stylePath}'`);
  return true;
};

class StyleExtHtmlWebpackPlugin {

  constructor (filename) {
    this.enabled = (filename !== false);
    this.cssFilename = (typeof filename === 'string') ? filename : undefined;
    debug(`constructor: enabled=${this.enabled}, filename=${this.cssFilename}`);
  }

  apply (compiler) {
    if (this.enabled) {
      // remove <link> and add <style>
      compiler.plugin('compilation', (compilation) => {
        compilation.plugin(EVENT, (pluginArgs, callback) => {
          if (validateFilename.bind(this)(compilation.assets)) {
            debug(`${EVENT}: CSS file in compilation: '${this.cssFilename}'`);
            const css = compilation.assets[this.cssFilename].source();
            debug(`${EVENT}: CSS in compilation: ${css}`);
            const replacementStyleTag = {
              tagName: 'style',
              closeTag: true,
              innerHTML: css
            };
            pluginArgs.head = pluginArgs.head.map((tag) => {
              return (isStyleLinkTag(tag, this.cssFilename)) ? replacementStyleTag : tag;
            });
            debug(`${EVENT}: completed`);
            callback(null, pluginArgs);
          } else {
            debug(`${EVENT}: error, no CSS file found in compilation`);
            const err = new Error(CSS_FILE_NOT_FOUND);
            callback(err);
          }
        });
      });

      // delete external stylesheet here
      compiler.plugin('emit', (compilation, callback) => {
        if (this.cssFilename) {
          delete compilation.assets[this.cssFilename];
          callback();
        }
      });
    }
  }

  /**
   * Guard against pre v3 configurations
   */
  static inline (loaders) {
    throw new Error(V2_CONFIG_DETECTED);
  }
}

module.exports = StyleExtHtmlWebpackPlugin;
