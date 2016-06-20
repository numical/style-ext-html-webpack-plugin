'use strict';

const ID = 'style-ext-html-webpack-plugin';
const START = '/*';
const END = '*/';

module.exports = {
  PLUGIN_ID: 'style-ext-html-webpack-plugin',
  COMMENT_START: START,
  COMMENT_START_REGEXP: /\u002F\u002A/g,
  COMMENT_END: END,
  COMMENT_END_REGEXP: /\u002A\u002F/g,
  START_TAG: START + ' ' + ID + ':start: ',
  END_TAG: ' :' + ID + ':end ' + END,
  ESCAPED_COMMENT_START: ID + ':commentstart',
  ESCAPED_COMMENT_END: ID + ':commentend',
  RUNTIME_COMMENT: START + ' removed by ' + ID
};
