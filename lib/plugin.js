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
  error(`${PLUGIN} could not find ExtractTextWebpackPlugin\'s generated .css file; available files: '${filenames.join()}'`);
};

const validatePassedCssFilename = (cssFilename, compilation) => {
  let matchFn = (filename) => filename === cssFilename;

  // what's done may never be did again
  if(compilation.processed && compilation.processed.includes(cssFilename)) {
    matchFn = (filename) => filename !== cssFilename && CSS_REGEX.test(filename);
    deleteFileFromCompilation(cssFilename, compilation);
  }

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

const replaceLinkTag = (stylePath, tags, replacementTag, compilation) => {
  for (let index = 0; index < tags.length; index++) {
    if (isCssLinkTag(tags[index], stylePath)) {
      tags[index] = replacementTag;

      // a successful replacement should store a reference of processed files
      compilation.processed = compilation.processed || [];
      compilation.processed.push(stylePath);
      debug(`${EVENT} replaced <link> with <style>`);
      return;
    }
  }
  error(`S{PLUGIN} could not find <link> element to replace; available head elements: ${JSON.stringify(tags)}`);
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

class StyleExtHtmlWebpackPlugin {

  constructor (filename) {
    this.enabled = (filename !== false);
    this.cssFilename = (typeof filename === 'string') ? filename : undefined;
    debug(`constructor: enabled=${this.enabled}, filename=${this.cssFilename}`);
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
            replaceLinkTag(stylePath, pluginArgs.head, replacementTag, compilation);
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
