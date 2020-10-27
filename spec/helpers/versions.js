'use strict';
/* eslint-env jasmine */

const setModuleVersion = require('dynavers')('dynavers.json');

class ExtractPlugin {
  constructor ({ name, version, loader }) {
    this.name = name;
    this.version = version;
    this.loader = loader.bind(this);
    this.module = this.module.bind(this);
    this.create = this.create.bind(this);
  }

  module () {
    return require(this.name);
  }

  create (filename) {
    const constructor = this.module();
    return new constructor({ filename });
  }
}

const extractTextLoader = function (cssLoaders, instance) {
  const parent = instance || this.module();
  return parent.extract({
    fallback: 'style-loader',
    use: cssLoaders
  });
};

const miniCssLoader = function (cssLoaders) {
  return [this.module().loader, ...cssLoaders];
};

const EXTRACT_PLUGINS = {
  extractTextWebpackPlugin3: new ExtractPlugin({
    name: 'extract-text-webpack-plugin',
    version: '3.0.2',
    loader: extractTextLoader
  }),
  extractTextWebpackPlugin4: new ExtractPlugin({
    name: 'extract-text-webpack-plugin',
    version: '4.0.0-beta.0',
    loader: extractTextLoader
  }),
  miniCSSExtractPlugin: new ExtractPlugin({
    name: 'mini-css-extract-plugin',
    version: '0.7.0',
    loader: miniCssLoader
  })
};

const testFunctions = {
  hmr: xit,
  templateStyles: it,
  multiEntry: it,
  sharedEvent: it
};

const VERSIONS = {
  webpack3: {
    major: 3,
    webpack: '3.12.0',
    htmlWebpackPlugin: '3.2.0',
    extractPlugin: EXTRACT_PLUGINS.extractTextWebpackPlugin3,
    testFn: testFunctions
  },
  webpack4: {
    major: 4,
    webpack: '4.44.2',
    htmlWebpackPlugin: '3.2.0',
    extractPlugin: EXTRACT_PLUGINS.miniCSSExtractPlugin,
    testFn: {
      hmr: xit,
      templateStyles: it,
      multiEntry: xit,
      sharedEvent: it
    }
  },
  webpack4extractTextPlugin4: {
    major: 4,
    webpack: '4.44.2',
    htmlWebpackPlugin: '3.2.0',
    extractPlugin: EXTRACT_PLUGINS.extractTextWebpackPlugin4,
    testFn: testFunctions
  },
  webpack4htmlPlugin4: {
    major: 4,
    webpack: '4.44.2',
    htmlWebpackPlugin: '4.0.0-beta.5',
    extractPlugin: EXTRACT_PLUGINS.miniCSSExtractPlugin,
    testFn: {
      hmr: xit,
      templateStyles: xit,
      multiEntry: xit,
      sharedEvent: xit
    }
  }
};

const selected = VERSIONS[process.env.VERSION];
if (selected) {
  const { webpack, htmlWebpackPlugin, extractPlugin } = selected;
  setModuleVersion('webpack', webpack, true);
  setModuleVersion('html-webpack-plugin', htmlWebpackPlugin, true);
  setModuleVersion(extractPlugin.name, extractPlugin.version, true);
  selected.display = `webpack v${webpack}, htmlWebpackPlugin v${htmlWebpackPlugin}, ${extractPlugin.name} v${extractPlugin.version}`;
} else {
  throw new Error(`Unknown webpack version '${process.env.VERSION}'`);
}

module.exports = selected;
