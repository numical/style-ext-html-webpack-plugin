'use strict';

const contentWrapper = require('./wrapper.js');
const runtimeComment = require('./constants.js').STRINGS.RUNTIME_COMMENT;
const extractedCss = new WeakMap();
const ReplaceSource = require('webpack-sources').ReplaceSource;
const debug = require('debug')('StyleExtHtmlWebpackPlugin:plugin');
const detailDebug = require('debug')('StyleExtHtmlWebpackPlugin:detail');

class StyleExtHtmlWebpackPlugin {

  constructor (options) {
    this.options = Object.assign({minify: false}, options);
  }

  apply (compiler) {
    const extractCss = this.extractCss.bind(this);

    compiler.plugin('watch-run', (watching, callback) => {
      let err;
      if (compiler.options.devtool && compiler.options.devtool.indexOf('eval') > -1) {
        err = new Error('StyleExtHtmlWebpack plugin incompatible with \'eval\' devtool option');
      }
      callback(err);
    });

    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', function (chunks, callback) {
        debug('optimize-chunk-assets');
        chunks.forEach(function (chunk) {
          chunk.files.forEach(function (file) {
            extractCss(compilation, file);
          });
        });
        callback();
      });

      compilation.plugin('html-webpack-plugin-after-html-processing', (htmlPluginData, callback) => {
        debug('html-webpack-plugin-after-html-processing');
        this.addInlineCss(compilation, htmlPluginData, callback);
      });
    });
  }

  extractCss (compilation, file) {
    detailDebug('searching file \'' + file + '\'');
    // this will be very slow - how filter to focus only on assets that matter?
    const source = compilation.assets[file].source();
    const wrappedCss = contentWrapper.extractWrappedContent(source);
    if (wrappedCss.length > 0) {
      debug('file \'' + file + '\' contains css (use StyleExtHtmlWebpackPlugin:detail option to view)');
      const replacement = new ReplaceSource(compilation.assets[file]);
      const css = wrappedCss.map((wrapped) => {
        detailDebug(wrapped.content);
        replacement.replace(wrapped.startIndex, wrapped.endIndex, runtimeComment);
        return wrapped.content;
      });
      extractedCss.set(compilation, css.concat(extractedCss.get(compilation) || []));
      compilation.assets[file] = replacement;
    }
  }

  addInlineCss (compilation, htmlPluginData, callback) {
    debug('addInlineCss');
    if (extractedCss.has(compilation)) {
      if (this.options.minify) {
        this.minify(compilation, htmlPluginData, callback);
      } else {
        const styles = this.combineInlineCss(compilation);
        this.insertStylesInHead(styles, htmlPluginData, callback);
      }
    } else {
      debug('warning: no extracted css');
      callback(null, htmlPluginData);
    }
  }

  combineInlineCss (compilation) {
    debug('combineInlineCss');
    return extractedCss.get(compilation).join('\n');
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
