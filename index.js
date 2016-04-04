'use strict';

const INLINE_CSS = require.resolve('./constant.js');

class StyleExtHtmlWebpackPlugin {

  apply (compiler) {
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('html-webpack-plugin-after-html-processing', (htmlPluginData, callback) => {
        this.addInlineCss(compilation, htmlPluginData, callback);
      });
    });
  }

  addInlineCss (compilation, htmlPluginData, callback) {
    if (compilation[INLINE_CSS]) {
      const styles = '<style>' + compilation[INLINE_CSS].join('\n') + '</style>';
      htmlPluginData.html = htmlPluginData.html.replace(/(<\/head>)/i, (match) => {
        return styles + match;
      });
    }
    callback();
  }

  /**
   * Inject loader for in-line styles
   */
  static inline (loaders) {
    const inlineLoader = require.resolve('./loader.js');
    return [ inlineLoader ].concat(loaders || []).join('!');
  }
}

module.exports = StyleExtHtmlWebpackPlugin;
