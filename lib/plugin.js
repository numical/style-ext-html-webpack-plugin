'use strict';

const CleanCss = require('clean-css');
const common = require('./common.js');
const debug = common.debug;
const error = common.error;
const denormaliseOptions = require('./config.js');
const findCssFile = require('./findFile.js');
const replaceLinkTagWithStyleTag = require('./replaceTag.js');
const insertStyleTagInHtml = require('./insertStyle.js');
const deleteFileFromCompilation = require('./removeFile.js');

const wirePluginEvent = (event, compilation, fn) => {
  compilation.plugin(event, (pluginArgs, callback) => {
    try {
      fn(pluginArgs);
      callback(null, pluginArgs);
    } catch (err) {
      callback(err);
    }
  });
};

class StyleExtHtmlWebpackPlugin {
  constructor (options) {
    this.options = denormaliseOptions(options);
    debug(`constructor: ${JSON.stringify(this.options)}}`);
  }

  apply (compiler) {
    const options = this.options;
    if (!options.enabled) return;
    const minifier = (options.minify)
      ? new CleanCss(options.minify)
      : false;
    let cssFilename;

    compiler.plugin('compilation', (compilation) => {
      wirePluginEvent(
        'html-webpack-plugin-before-html-processing',
        compilation,
        (pluginArgs) => {
          cssFilename = findCssFile(options, pluginArgs.plugin.options, compilation);
        }
      );

      if (options.position === 'plugin') {
        wirePluginEvent(
          'html-webpack-plugin-alter-asset-tags',
          compilation,
          (pluginArgs) => {
            if (cssFilename) {
              replaceLinkTagWithStyleTag(cssFilename, pluginArgs, compilation, minifier);
            }
          }
        );
      }

      if (options.position !== 'plugin') {
        wirePluginEvent(
          'html-webpack-plugin-after-html-processing',
          compilation,
          (pluginArgs) => {
            if (cssFilename) {
              insertStyleTagInHtml(cssFilename, options.position, pluginArgs, compilation, minifier);
            }
          }
        );
      }
    });

    compiler.plugin('emit', (compilation, callback) => {
      if (cssFilename) {
        deleteFileFromCompilation(cssFilename, compilation);
      }
      callback();
    });
  }

  /**
   * Guard against pre v3 configurations
   */
  static inline (loaders) {
    error(`legacy configuration detected - please see https://github.com/numical/style-ext-html-webpack-plugin for how to configure v3.x+`);
  }
}

module.exports = StyleExtHtmlWebpackPlugin;
