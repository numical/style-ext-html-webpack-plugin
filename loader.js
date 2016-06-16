'use strict';

const wrap = require('./wrapper.js').wrapContent;

module.exports = function (content) {
  this.cacheable();
  return wrap(content);
};
