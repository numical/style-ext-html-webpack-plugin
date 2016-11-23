'use strict';

const ID = 'style-ext-html-webpack-plugin';
const START = '/*';
const END = '*/';

module.exports = {
  STRINGS: {
    PLUGIN_ID: 'style-ext-html-webpack-plugin',
    COMMENT_START: START,
    COMMENT_END: END,
    START_TAG: ' ' + START + ' ' + ID + ':start: ',
    END_TAG: ' :' + ID + ':end ' + END + ' ',
    ESCAPED_COMMENT_START: ID + ':commentstart:',
    ESCAPED_COMMENT_END: ':' + ID + ':commentend',
    RUNTIME_COMMENT: 'inlined '
  },
  REGEXPS: {
    COMMENT_START: /\u002F\u002A/g,
    COMMENT_END: /\u002A\u002F/g,
    ESCAPED_COMMENT_START: /style-ext-html-webpack-plugin:commentstart:/g,
    ESCAPED_COMMENT_END: /:style-ext-html-webpack-plugin:commentend/g,
    RUNTIME_COMMENT: / \u002f\u002a style-ext-html-webpack-plugin:start: inlined :style-ext-html-webpack-plugin:end \u002a\u002f /g
  }
};
