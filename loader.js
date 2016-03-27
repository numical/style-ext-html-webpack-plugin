'use strict';

module.exports = function (content) {
  // The context is passed as 'this' via fn.apply in webpack code.
  // Using a context that is undeclared in the function API seems wrong,
  // but no other way to tie the CSS to a particular compilation.
  var compilation = this._compilation;
  if (!compilation.inlineCss) {
    compilation.inlineCss = [content];
  } else {
    compilation.inlineCss = compilation.inlineCss.concat(content);
  }
  return '/* removed by style-ext-html-webpack-plugin */';
};
