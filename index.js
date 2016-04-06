'use strict';

const INLINE_CSS = require('./constant.js');

class StyleExtHtmlWebpackPlugin {

  constructor (options) {
    this.options = Object.assign({minify: false}, options);
  }

  apply (compiler) {
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('html-webpack-plugin-after-html-processing', (htmlPluginData, callback) => {
        this.addInlineCss(compilation, htmlPluginData, callback);
      });
    });
  }

  addInlineCss (compilation, htmlPluginData, callback) {
    if (compilation[INLINE_CSS]) {
      var styles = compilation[INLINE_CSS].join('\n');
      if (this.options.minify) {
        this.minify(styles, htmlPluginData, callback);
      } else {
        this.insertStylesInHead(styles, htmlPluginData, callback);
      }
    } else {
      callback();
    }
  }

  minify (styles, htmlPluginData, callback) {
    const CleanCSS = require('clean-css');
    if (typeof this.options.minify !== 'object') {
      this.options.minify = {};
    }
    const minifier = new CleanCSS(this.options.minify);
    minifier.minify(styles, (error, minified) => {
      if (error) throw error;
      this.insertStylesInHead(minified.styles, htmlPluginData, callback);
    });
  }

  insertStylesInHead (styles, htmlPluginData, callback) {
    styles = '<style>' + styles + '</style>';
    htmlPluginData.html = htmlPluginData.html.replace(/(<\/head>)/i, (match) => {
      return styles + match;
    });
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
