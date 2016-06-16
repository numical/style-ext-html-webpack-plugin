'use strict';

const ID = 'style-ext-html-webpack-plugin';
const COMMENT_START = '/*';
const COMMENT_END = '*/';
const START_TAG = COMMENT_START + ' ' + ID + ':start: ';
const END_TAG = ': ' + ID + ':end ' + COMMENT_END;
const ESCAPED_COMMENT_START = ID + ':commentstart';
const ESCAPED_COMMENT_END = ID + ':commentend';

const escapeComments = (s) => {
  return s.indexOf(COMMENT_START) > -1
    ? s.replace(COMMENT_START, ESCAPED_COMMENT_START).replace(COMMENT_END, ESCAPED_COMMENT_END)
    : s;
};

const unescapeComments = (s) => {
  return s.indexOf(ESCAPED_COMMENT_START) > -1
    ? s.replace(ESCAPED_COMMENT_START, COMMENT_START).replace(ESCAPED_COMMENT_END, COMMENT_END)
    : s;
};

exports.wrapContent = (content) => START_TAG + escapeComments(content) + END_TAG;

exports.extractWrappedContent = (s) => {
  const results = [];
  let startIndex = 0;
  while (startIndex > -1) {
    startIndex = s.indexOf(START_TAG, startIndex);
    if (startIndex > -1) {
      const endIndex = s.indexOf(END_TAG, startIndex);
      const content = unescapeComments(s.substring(startIndex + START_TAG.length, endIndex));
      results.push({
        startIndex: startIndex,
        endIndex: endIndex,
        content: content
      });
      startIndex = endIndex;
    }
  }
  return results;
};

