'use strict';

const debug = require('debug')('StyleExt');

const PLUGIN = 'StyleExtHtmlWebpackPlugin';
const EVENT = 'html-webpack-plugin-alter-asset-tags';
const CSS_REGEX = /\.css$/;

const error = msg => {
  const err = new Error(msg);
  err.name = PLUGIN + 'Error';
  throw err;
};

const findGeneratedCssFile = (matchFn, compilation) => {
  const filenames = Object.keys(compilation.assets);
  for (let filename of filenames) {
    if (matchFn(filename)) {
      debug(`${EVENT}: CSS file in compilation: '${filename}'`);
      return filename;
    }
  }
  error(`${PLUGIN} could not find ExtractTextWebpackPlugin's generated .css file; available files: '${filenames.join()}'`);
};

const validatePassedCssFilename = (cssFilename, compilation) => {
  const matchFn = (filename) => filename === cssFilename;
  return findGeneratedCssFile(matchFn, compilation);
};

const identifyCssFilename = (compilation) => {
  const matchFn = (filename) => CSS_REGEX.test(filename);
  return findGeneratedCssFile(matchFn, compilation);
};

const generateReplacementStyleTag = (cssFilename, compilation) => {
  const css = compilation.assets[cssFilename].source();
  debug(`${EVENT}: CSS in compilation: ${css}`);
  return {
    tagName: 'style',
    closeTag: true,
    innerHTML: css
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
      debug(`${EVENT} replaced <link> with <style>`);
      return;
    }
  }
  tags.push(replacementTag);
  debug(`${EVENT} added new <link>`);
  // error(`S{PLUGIN} could not find <link> element to replace; available head elements: ${JSON.stringify(tags)}`);
};

const isCssLinkTag = (tagDefinition, stylePath) => {
  if (!tagDefinition) return false;
  if (tagDefinition.tagName !== 'link') return false;
  if (!tagDefinition.attributes) return false;
  if (!tagDefinition.attributes.href) return false;
  if (tagDefinition.attributes.href !== stylePath) return false;
  debug(`${EVENT}: link element found for style path '${stylePath}'`);
  return true;
};

const deleteFileFromCompilation = (filename, compilation) => {
  delete compilation.assets[filename];
  compilation.chunks.forEach(chunk => {
    const fileIndex = chunk.files.indexOf(filename);
    if (fileIndex > -1) {
      chunk.files.splice(fileIndex, 1);
    }
  });
};

function parseOptions (options) {
  if (options === undefined) {
    this.enabled = true;
  } else {
    switch (typeof options) {
      case 'boolean':
        this.enabled = options;
        break;
      case 'string':
        this.enabled = true;
        this.cssFilename = options;
        break;
      case 'object':
        if (options.hasOwnProperty('enabled')) {
          this.enabled = options.enabled;
        } else {
          this.enabled = true;
        }
        if (options.hasOwnProperty('file')) {
          this.cssFilename = options.file;
        }
        if (options.hasOwnProperty('chunks')) {
          this.chunks = options.chunks;
        }
        break;
      default:
        error(`${PLUGIN} invalid args - please see https://github.com/numical/style-ext-html-webpack-plugin for configuration options`);
    }
  }
}

class StyleExtHtmlWebpackPlugin {

  constructor (options) {
    parseOptions.bind(this)(options);
    debug(`constructor: enabled=${this.enabled}, filename=${this.cssFilename}, chunks=${this.chunks}`);
  }

  apply (compiler) {
    if (this.enabled) {
      let cssFilename = this.cssFilename;

      // remove <link> and add <style>
      compiler.plugin('compilation', (compilation) => {
        compilation.plugin(EVENT, (pluginArgs, callback) => {
          try {
            cssFilename = (cssFilename)
              ? validatePassedCssFilename(cssFilename, compilation)
              : identifyCssFilename(compilation);
            const replacementTag = generateReplacementStyleTag(cssFilename, compilation);
            const stylePath = handlePublicPath(cssFilename, compilation);
            replaceLinkTag(stylePath, pluginArgs.head, replacementTag);
            callback(null, pluginArgs);
          } catch (err) {
            callback(err);
          }
        });
      });

      // delete external stylesheet here
      compiler.plugin('emit', (compilation, callback) => {
        if (cssFilename) {
          deleteFileFromCompilation(cssFilename, compilation);
          debug(`emit: asset '${this.cssFilename}' deleted`);
          callback();
        }
      });
    }
  }

  /**
   * Guard against pre v3 configurations
   */
  static inline (loaders) {
    error(`${PLUGIN} legacy configuration detected - please see https://github.com/numical/style-ext-html-webpack-plugin for how to configure v3.x+`);
  }
}

module.exports = StyleExtHtmlWebpackPlugin;
