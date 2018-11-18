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
const PLUGIN = 'StyleExtHtmlWebpackPlugin';

class StyleExtHtmlWebpackPlugin {
  constructor (options) {
    this.options = denormaliseOptions(options);
    this.filesToDelete = new Set();
    debug(`constructor: ${JSON.stringify(this.options)}}`);
  }

  apply (compiler) {
    const options = this.options;
    if (!options.enabled) return;

    const compile = this.compilationCallback.bind(this, options);
    const emit = this.emitCallback.bind(this);

    if (compiler.hooks) {
      compiler.hooks.compilation.tap(PLUGIN, compile);
      compiler.hooks.emit.tap(PLUGIN, emit);
    } else {
      compiler.plugin('compilation', compile);
      compiler.plugin('emit', emit);
    }
  }

  compilationCallback (options, compilation) {
    const minifier = (options.minify) ? new CleanCss(options.minify) : false;
    const wire = this.wirePluginEvent.bind(this);

    let cssFilename;

    wire(
      'html-webpack-plugin-before-html-processing',
      compilation,
      (pluginArgs) => {
        cssFilename = findCssFile(options, pluginArgs.plugin.options, compilation);
        if (cssFilename) {
          this.filesToDelete.add(cssFilename);
        }
      }
    );

    if (options.position === 'plugin') {
      wire(
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
      wire(
        'html-webpack-plugin-after-html-processing',
        compilation,
        (pluginArgs) => {
          if (cssFilename) {
            insertStyleTagInHtml(cssFilename, options.position, pluginArgs, compilation, minifier);
          }
        }
      );
    }
  }

  // deals with webpack 4 changes:
  // < webpack 4.x - callbacks and plugin method
  // >= webpack 4.x - no callbacks and use tap method
  wirePluginEvent (event, compilation, fn) {
    const wrappedFn = (pluginArgs, callback) => {
      try {
        fn(pluginArgs);
        if (callback) {
          callback(null, pluginArgs);
        }
      } catch (err) {
        if (callback) {
          callback(err);
        } else {
          compilation.errors.push(err);
        }
      }
    };
    if (compilation.hooks) {
      compilation.hooks[event].tapAsync(PLUGIN, wrappedFn);
    } else {
      compilation.plugin(event, wrappedFn);
    }
  }

  emitCallback (compilation, callback) {
    if (this.filesToDelete.size > 0) {
      const deleteFile = deleteFileFromCompilation.bind(null, compilation);
      this.filesToDelete.forEach(deleteFile);
      this.filesToDelete.clear();
    }
    if (callback) {
      callback();
    }
  }
  /**
   * Guard against pre v3 configurations
   */
  static inline (loaders) {
    error(`legacy configuration detected - please see https://github.com/numical/style-ext-html-webpack-plugin for how to configure v3.x+`);
  }
}

module.exports = StyleExtHtmlWebpackPlugin;
