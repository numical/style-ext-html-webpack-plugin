'use strict';

const common = require('./common.js');
const path = require('path');
const debug = common.debug;
const extractCss = common.extractCss;

const generateReplacementStyleTag = (cssFilename, compilation, minifier) => {
  return {
    tagName: 'style',
    closeTag: true,
    innerHTML: extractCss(cssFilename, compilation, minifier)
  };
};

const handlePublicPath = (cssFilename, pluginArgs, compilation) => {

  const prefix = typeof compilation.options.output.publicPath !== 'undefined'
    // If a hard coded public path exists use it
    ? compilation.mainTemplate.getPublicPath({hash: compilation.hash})
    // If no public path was set get a relative url path
    : path.relative(path.resolve(compilation.options.output.path, path.dirname(pluginArgs.plugin.childCompilationOutputName)), compilation.options.output.path)
      .split(path.sep).join('/');

  if (prefix) {
    cssFilename = path.join(prefix, cssFilename);
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

const replaceLinkTagWithStyleTag = (cssFilename, pluginArgs, compilation, minifier) => {
  const replacementTag = generateReplacementStyleTag(cssFilename, compilation, minifier);
  const stylePath = handlePublicPath(cssFilename, pluginArgs, compilation);
  replaceLinkTag(stylePath, pluginArgs.head, replacementTag);
};

module.exports = replaceLinkTagWithStyleTag;
