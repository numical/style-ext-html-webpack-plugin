'use strict';

const common = require('./common.js');
const path = require('path');
const url = require('url');
const debug = common.debug;
const extractCss = common.extractCss;

const generateReplacementStyleTag = (cssFilename, compilation, minifier) => {
  return {
    tagName: 'style',
    closeTag: true,
    innerHTML: extractCss(cssFilename, compilation, minifier)
  };
};

const convertToPath = (cssFilename, pluginArgs, compilation) => {
  // public path: copied from https://github.com/jantimon/html-webpack-plugin/blob/master/index.js#L394
  const prefix = typeof compilation.options.output.publicPath !== 'undefined'
    ? compilation.mainTemplate.getPublicPath({ hash: compilation.hash })
    : path.relative(path.resolve(compilation.options.output.path, path.dirname(pluginArgs.plugin.childCompilationOutputName)), compilation.options.output.path)
      .split(path.sep).join('/');

  if (prefix) {
    cssFilename = url.resolve(prefix, cssFilename);
  }

  // hash:
  if (pluginArgs.plugin.options.hash) {
    const suffix = (cssFilename.indexOf('?') === -1) ? '?' : '&';
    cssFilename = `${cssFilename}${suffix}${compilation.hash}`;
  }

  debug(`looking for style path '${cssFilename}'`);
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
  const stylePath = convertToPath(cssFilename, pluginArgs, compilation);
  replaceLinkTag(stylePath, pluginArgs.head, replacementTag);
};

module.exports = replaceLinkTagWithStyleTag;
