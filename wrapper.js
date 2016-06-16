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

exports.hasWrappedContent = (s) => s.indexOf(START_TAG) > -1;

exports.extractWrappedContent = (s) => {
  const startIndex = s.indexOf(START_TAG);
  if (startIndex === -1) return;
  const endIndex = s.indexOf(END_TAG, startIndex);
  if (endIndex === -1) return;
  return {
    startIndex: startIndex,
    endIndex: endIndex + END_TAG.length,
    content: unescapeComments(s.substring(startIndex + START_TAG.length, endIndex))
  };
};

