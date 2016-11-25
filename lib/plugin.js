'use strict';

const V2_CONFIG_DETECTED = 'StyleExtHtmlWebpackPlugin legacy configuration detected - please see https://github.com/numical/style-ext-html-webpack-plugin for how to configure v3.x+';

const isStyleLinkTag = (tagDefinition, stylePath) => {
  if (!tagDefinition) return false;
  if (tagDefinition.tagName !== 'link') return false;
  if (!tagDefinition.attributes) return false;
  if (!tagDefinition.attributes.href) return false;
  return tagDefinition.attributes.href === stylePath;
};

class StyleExtHtmlWebpackPlugin {

  constructor (filename) {
    this.filename = filename;
  }

  apply (compiler) {
    compiler.plugin('compilation', (compilation) => {
      // remove <link> and add <style> here </style>
      compilation.plugin('html-webpack-plugin-alter-asset-tags', (pluginArgs, callback) => {
        const replacementStyleTag = {
          tagName: 'style',
          closeTag: true,
          innerHTML: compilation.assets[this.filename].source()
        };
        pluginArgs.head = pluginArgs.head.map((tag) => {
          return (isStyleLinkTag(tag, this.filename)) ? replacementStyleTag : tag;
        });
        callback(null, pluginArgs);
      });
    });

    // delete external stylesheet here
    compiler.plugin('emit', (compilation, callback) => {
      delete compilation.assets[this.filename];
      callback();
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
