'use strict';

function InlineExtHtmlWebpackPlugin () {
}

InlineExtHtmlWebpackPlugin.prototype.apply = function (compiler) {
  var self = this;
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-after-html-processing', self.addInlineCss);
  });
};

InlineExtHtmlWebpackPlugin.prototype.addInlineCss = function (htmlPluginData, callback) {
  // compilation passed as this
  if (this.inlineCss) {
    var splitHtml = htmlPluginData.html.split('</head>');
    var head = splitHtml[0];
    var body = splitHtml[1];
    var scripts = this.inlineCss.map(function (css) {
      return '<style>' + css + '</style>';
    });
    htmlPluginData.html = [head].concat(scripts).concat('</head>').concat(body).join('');
  }
  callback();
};

/**
 * Inject loader for in-line styles
 */
InlineExtHtmlWebpackPlugin.inline = function (loaders) {
  var inlineLoader = require.resolve('./loader.js');
  if (loaders) {
    loaders = [ inlineLoader ].concat(loaders).join('!');
  } else {
    loaders = inlineLoader;
  }
  return loaders;
};

module.exports = InlineExtHtmlWebpackPlugin;
