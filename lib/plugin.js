'use strict';

const V2_CONFIG_DETECTED = 'StyleExtHtmlWebpackPlugin legacy configuration detected - please see https://github.com/numical/style-ext-html-webpack-plugin for how to configure v3.x+';
const CSS_FILE_NOT_FOUND = 'StyleExtHtmlWebpackPlugin could not find ExtractTextWebpackPlugin\'s generated .css file';
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
  return tagDefinition.attributes.href === stylePath;
};

class StyleExtHtmlWebpackPlugin {

  constructor (filename) {
    this.enabled = (filename !== false);
    this.cssFilename = (typeof filename === 'string') ? filename : undefined;
  }

  apply (compiler) {
    if (this.enabled) {
      // remove <link> and add <style>
      compiler.plugin('compilation', (compilation) => {
        compilation.plugin('html-webpack-plugin-alter-asset-tags', (pluginArgs, callback) => {
          if (validateFilename.bind(this)(compilation.assets)) {
            const replacementStyleTag = {
              tagName: 'style',
              closeTag: true,
              innerHTML: compilation.assets[this.cssFilename].source()
            };
            pluginArgs.head = pluginArgs.head.map((tag) => {
              return (isStyleLinkTag(tag, this.cssFilename)) ? replacementStyleTag : tag;
            });
            callback(null, pluginArgs);
          } else {
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
