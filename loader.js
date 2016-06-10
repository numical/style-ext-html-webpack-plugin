'use strict';

const INLINE_CSS = require('./constant.js');
const debug = require('debug')('StyleExtHtmlWebpackPlugin:loader');
const detailDebug = require('debug')('StyleExtHtmlWebpackPlugin:detail');

module.exports = function (content) {
  // The context is passed as 'this' via fn.apply in webpack code.
  // Using a context that is undeclared in the function API seems wrong,
  // but no other way to tie the CSS to a particular compilation.
  const compilation = this._compilation;
  if (!compilation[INLINE_CSS]) {
    debug('no compilation[INLINE_CSS]');
    compilation[INLINE_CSS] = [content];
  } else {
    debug('existing compilation[INLINE_CSS]');
    compilation[INLINE_CSS] = compilation[INLINE_CSS].concat(content);
  }
  detailDebug('loader result: compilation[INLINE_CSS]: ' + compilation[INLINE_CSS]);
  return '/* removed by style-ext-html-webpack-plugin */';
};
