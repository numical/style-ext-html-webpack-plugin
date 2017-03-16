'use strict';

const common = require('./common.js');
const extractCss = common.extractCss;
const debug = common.debug;
const error = common.error;

const errorMsg = 'invalid args - please see https://github.com/numical/style-ext-html-webpack-plugin for configuration options';

const createStyleTag = (cssFilename, compilation, options, minifier) => {
  const css = extractCss(cssFilename, compilation, minifier);

  let tag = 'style';
  let attributes = '';

  if (!!options.tag){
      tag = options.tag
  }

  for(let key in options.attributes){
      attributes += ' ' +  key + (options.attributes[key] ? ('="' + options.attributes[key] + '"') : '')
  }

  const styleTag = `<` + tag + attributes + `>${css}</` + tag + `>`;
  debug('added new <style>');
  return styleTag;
};

const insertStyleTagInHtml = (cssFilename, options, pluginArgs, compilation, minifier) => {
  const styleTag = createStyleTag(cssFilename, compilation, options, minifier);
  let toReplace;
  let replaceWith;
  switch (options.position) {
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
