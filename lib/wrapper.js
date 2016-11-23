'use strict';

const C = require('./constants.js');

const escapeComments = (s) => {
  return s.indexOf(C.STRINGS.COMMENT_START) > -1
    ? s.replace(C.REGEXPS.COMMENT_START, C.STRINGS.ESCAPED_COMMENT_START)
       .replace(C.REGEXPS.COMMENT_END, C.STRINGS.ESCAPED_COMMENT_END)
    : s;
};

const unescapeComments = (s) => {
  return s.indexOf(C.STRINGS.ESCAPED_COMMENT_START) > -1
    ? s.replace(C.REGEXPS.ESCAPED_COMMENT_START, C.STRINGS.COMMENT_START)
       .replace(C.REGEXPS.ESCAPED_COMMENT_END, C.STRINGS.COMMENT_END)
    : s;
};

exports.wrapContent = (content) => {
  const escapedContent = JSON.stringify(escapeComments(content));
  return C.STRINGS.START_TAG + escapedContent + C.STRINGS.END_TAG;
};

exports.extractWrappedContent = (s) => {
  const results = [];
  let startIndex = 0;
  while (startIndex > -1) {
    startIndex = s.indexOf(C.STRINGS.START_TAG, startIndex);
    if (startIndex > -1) {
      startIndex = startIndex + C.STRINGS.START_TAG.length;
      const endIndex = s.indexOf(C.STRINGS.END_TAG, startIndex);
      const escapedContent = s.substring(startIndex, endIndex);
      const content = unescapeComments(JSON.parse(escapedContent));
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

