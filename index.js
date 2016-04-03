'use strict';

function StyleExtHtmlWebpackPlugin () {
}

StyleExtHtmlWebpackPlugin.prototype.apply = function (compiler) {
  var self = this;
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-after-html-processing', function (htmlPluginData, callback) {
      self.addInlineCss(compilation, htmlPluginData, callback);
    });
  });
};

StyleExtHtmlWebpackPlugin.prototype.addInlineCss = function (compilation, htmlPluginData, callback) {
  if (compilation.inlineCss) {
    var styles = '<style>' + compilation.inlineCss.join('\n') + '</style>';
    htmlPluginData.html = htmlPluginData.html.replace(/(<\/head>)/i, function (match) {
      return styles + match;
    });
  }
  callback();
};

/**
 * Inject loader for in-line styles
 */
StyleExtHtmlWebpackPlugin.inline = function (loaders) {
  var inlineLoader = require.resolve('./loader.js');
  return [ inlineLoader ].concat(loaders || []).join('!');
};

module.exports = StyleExtHtmlWebpackPlugin;
