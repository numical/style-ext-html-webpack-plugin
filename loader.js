'use strict';

const CSS_STORE = require('./store.js');
const debug = require('debug')('StyleExtHtmlWebpackPlugin:loader');
const detailDebug = require('debug')('StyleExtHtmlWebpackPlugin:detail');

module.exports = function (content) {
  // The context is passed as 'this' via fn.apply in webpack code.
  // Using a context that is undeclared in the function API seems wrong,
  // but no other way to tie the CSS to a particular compilation.
  const compilation = this._compilation;
  let css = CSS_STORE.get(compilation);
  if (!css) {
    debug('no stored css for compilation');
    css = [content];
  } else {
    debug('stored css for compilation');
    css = css.concat(content);
  }
  CSS_STORE.set(compilation, css);
  detailDebug('loader result: compilation css ' + css);
  return '/* removed by style-ext-html-webpack-plugin */';
};
