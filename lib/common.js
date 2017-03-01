'use strict';

const debug = require('debug')('StyleExt');

const PLUGIN = 'StyleExtHtmlWebpackPlugin';

const error = msg => {
  const err = new Error(`${PLUGIN}: ${msg}`);
  err.name = PLUGIN + 'Error';
  debug(`${PLUGIN} error: ${msg}`);
  throw err;
};

const extractCss = (cssFilename, compilation, minifier) => {
  let css = compilation.assets[cssFilename].source();
  debug(`CSS in compilation: ${css}`);
  if (minifier) {
    css = minifier.minify(css).styles;
    debug(`Minified CSS: ${css}`);
  }
  return css;
};

exports.debug = debug;
exports.error = error;
exports.extractCss = extractCss;
