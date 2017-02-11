'use strict';

const common = require('./common.js');
const debug = common.debug;
const extractCss = common.extractCss;

const generateReplacementStyleTag = (cssFilename, compilation) => {
  return {
    tagName: 'style',
    closeTag: true,
    innerHTML: extractCss(cssFilename, compilation)
  };
};

const handlePublicPath = (cssFilename, compilation) => {
  const prefix = compilation.outputOptions.publicPath;
  if (prefix) {
    cssFilename = prefix + cssFilename;
  }
  return cssFilename;
};

const replaceLinkTag = (stylePath, tags, replacementTag) => {
  for (let index = 0; index < tags.length; index++) {
    if (isCssLinkTag(tags[index], stylePath)) {
      tags[index] = replacementTag;
      debug(`replaced <link> with <style>`);
      return;
    }
  }
  tags.push(replacementTag);
  debug('added new <link>');
};

const isCssLinkTag = (tagDefinition, stylePath) => {
  if (!tagDefinition) return false;
  if (tagDefinition.tagName !== 'link') return false;
  if (!tagDefinition.attributes) return false;
  if (!tagDefinition.attributes.href) return false;
  if (tagDefinition.attributes.href !== stylePath) return false;
  debug(`link element found for style path '${stylePath}'`);
  return true;
};

const replaceLinkTagWithStyleTag = (cssFilename, pluginArgs, compilation) => {
  const replacementTag = generateReplacementStyleTag(cssFilename, compilation);
  const stylePath = handlePublicPath(cssFilename, compilation);
  replaceLinkTag(stylePath, pluginArgs.head, replacementTag);
};

module.exports = replaceLinkTagWithStyleTag;
