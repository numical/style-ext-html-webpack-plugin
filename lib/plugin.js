'use strict';

const V2_CONFIG_DETECTED = 'StyleExtHtmlWebpackPlugin legacy configuration detected - please see https://github.com/numical/style-ext-html-webpack-plugin for how to configure v3.x+';
const CSS_FILE_NOT_FOUND = 'StyleExtHtmlWebpackPlugin could not find ExtractTextWebpackPlugin\'s generated .css file';
const CSS_REGEX = /\.css$/;

const isStyleLinkTag = (tagDefinition, stylePath) => {
  if (!tagDefinition) return false;
  if (tagDefinition.tagName !== 'link') return false;
  if (!tagDefinition.attributes) return false;
  if (!tagDefinition.attributes.href) return false;
  return tagDefinition.attributes.href === stylePath;
};

class StyleExtHtmlWebpackPlugin {

  apply (compiler) {
    let cssFilename;

    const findCssFilename = (assets) => {
      return Object.keys(assets).some(filename => {
        if (CSS_REGEX.test(filename)) {
          cssFilename = filename;
          return true;
        }
      });
    };

    // remove <link> and add <style>
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('html-webpack-plugin-alter-asset-tags', (pluginArgs, callback) => {
        if (findCssFilename(compilation.assets)) {
          const replacementStyleTag = {
            tagName: 'style',
            closeTag: true,
            innerHTML: compilation.assets[cssFilename].source()
          };
          pluginArgs.head = pluginArgs.head.map((tag) => {
            return (isStyleLinkTag(tag, cssFilename)) ? replacementStyleTag : tag;
          });
        } else {
          compilation.errors.push(new Error(CSS_FILE_NOT_FOUND));
        }
        callback(null, pluginArgs);
      });
    });

    // delete external stylesheet here
    compiler.plugin('emit', (compilation, callback) => {
      if (cssFilename) {
        delete compilation.assets[cssFilename];
        callback();
      }
    });
  }

  /**
   * Guard against pre v3 configurations
   */
  static inline (loaders) {
    throw new Error(V2_CONFIG_DETECTED);
  }
}

module.exports = StyleExtHtmlWebpackPlugin;
