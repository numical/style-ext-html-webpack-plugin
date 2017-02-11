'use strict';

const common = require('./common.js');
const extractCss = common.extractCss;
const debug = common.debug;
const error = common.error;

const errorMsg = 'invalid args - please see https://github.com/numical/style-ext-html-webpack-plugin for configuration options';

const createStyleTag = (cssFilename, compilation) => {
  const styleTag = `<style>${extractCss(cssFilename, compilation)}</style>`;
  debug('added new <style>');
  return styleTag;
};

const insertStyleTagInHtml = (cssFilename, position, pluginArgs, compilation) => {
  const styleTag = createStyleTag(cssFilename, compilation);
  let toReplace;
  let replaceWith;
  switch (position) {
    case 'head-top':
      toReplace = '<head>';
      replaceWith = toReplace + styleTag;
      break;
    case 'head-bottom':
      toReplace = '</head>';
      replaceWith = styleTag + toReplace;
      break;
    case 'body-top':
      toReplace = '<body>';
      replaceWith = toReplace + styleTag;
      break;
    case 'body-bottom':
      toReplace = '</body>';
      replaceWith = styleTag + toReplace;
      break;
    default:
      error(errorMsg);
  }
  pluginArgs.html = pluginArgs.html.replace(toReplace, replaceWith);
};

module.exports = insertStyleTagInHtml;
