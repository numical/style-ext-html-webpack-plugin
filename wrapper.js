'use strict';

const C = require('./constants.js');
const ESCAPED_COMMENT_START = new RegExp(C.ESCAPED_COMMENT_START, 'g');
const ESCAPED_COMMENT_END = new RegExp(C.ESCAPED_COMMENT_END, 'g');
const ESCAPED_NEW_LINES = /\\n/g;
const ESCAPED_SPEECH_MARKS = /\\"/g;

const escapeComments = (s) => {
  return s.indexOf(C.COMMENT_START) > -1
    ? s.replace(C.COMMENT_START_REGEXP, C.ESCAPED_COMMENT_START)
       .replace(C.COMMENT_END_REGEXP, C.ESCAPED_COMMENT_END)
    : s;
};

const unescapeComments = (s) => {
  return s.indexOf(C.ESCAPED_COMMENT_START) > -1
    ? s.replace(ESCAPED_COMMENT_START, C.COMMENT_START)
       .replace(ESCAPED_COMMENT_END, C.COMMENT_END)
       .replace(ESCAPED_NEW_LINES, '\n')
       .replace(ESCAPED_SPEECH_MARKS, '"')
    : s;
};

exports.wrapContent = (content) => C.START_TAG + escapeComments(content) + C.END_TAG;

exports.extractWrappedContent = (s) => {
  const results = [];
  let startIndex = 0;
  while (startIndex > -1) {
    startIndex = s.indexOf(C.START_TAG, startIndex);
    if (startIndex > -1) {
      const endIndex = s.indexOf(C.END_TAG, startIndex);
      const content = unescapeComments(s.substring(startIndex + C.START_TAG.length, endIndex));
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

