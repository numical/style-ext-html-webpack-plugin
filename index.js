'use strict';

const INLINE_CSS = require('./constant.js');
const debug = require('debug')('StyleExtHtmlWebpackPlugin:plugin');
const detailDebug = require('debug')('StyleExtHtmlWebpackPlugin:detail');

class StyleExtHtmlWebpackPlugin {

  constructor (options) {
    this.options = Object.assign({minify: false}, options);
  }

  apply (compiler) {
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('html-webpack-plugin-after-html-processing', (htmlPluginData, callback) => {
        debug('html-webpack-plugin-after-html-processing event');
        this.addInlineCss(compilation, htmlPluginData, callback);
      });
    });
  }

  addInlineCss (compilation, htmlPluginData, callback) {
    debug('addInlineCss');
    if (compilation[INLINE_CSS]) {
      if (this.options.minify) {
        this.minify(compilation, htmlPluginData, callback);
      } else {
        const styles = this.combineInlineCss(compilation);
        this.insertStylesInHead(styles, htmlPluginData, callback);
      }
    } else {
      debug('no compilation[INLINE_CSS]');
      callback(null, htmlPluginData);
    }
  }

  combineInlineCss (compilation) {
    debug('combineInlineCss');
    return compilation[INLINE_CSS].join('\n');
  }

  minify (compilation, htmlPluginData, callback) {
    debug('minify');
    const CleanCSS = require('clean-css');
    if (typeof this.options.minify !== 'object') {
      this.options.minify = {};
    }
    const minifier = new CleanCSS(this.options.minify);
    const styles = this.combineInlineCss(compilation);
    minifier.minify(styles, (error, minified) => {
      if (error) {
        throw error;
      }
      if (minified) {
        // spread operator does not work on node v4.x
        // if (minified.errors) compilation.errors.push(...minified.errors);
        // if (minified.warnings) compilation.warnings.push(...minified.warnings);
        if (minified.errors) Array.prototype.push.apply(compilation.errors, minified.errors);
        if (minified.warnings) Array.prototype.push.apply(compilation.warnings, minified.warnings);
        this.insertStylesInHead(minified.styles, htmlPluginData, callback);
      }
    });
  }

  insertStylesInHead (styles, htmlPluginData, callback) {
    debug('insertStylesInHead');
    styles = '<style>' + styles + '</style>';
    detailDebug('insertStylesInHead: styles: ' + styles);
    htmlPluginData.html = htmlPluginData.html.replace(/(<\/head>)/i, (match) => {
      return styles + match;
    });
    detailDebug('insertStylesInHead: htmlPluginData.html: ' + htmlPluginData.html);
    callback(null, htmlPluginData);
  }

  /**
   * Inject loader for in-line styles
   */
  static inline (loaders) {
    debug('add inlineLoader');
    const inlineLoader = require.resolve('./loader.js');
    return [ inlineLoader ].concat(loaders || []).join('!');
  }
}

module.exports = StyleExtHtmlWebpackPlugin;
