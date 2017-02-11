'use strict';

const setModuleVersion = require('dynavers')('dynavers.json');

const VERSIONS = {
  webpack1: {
    isWebpack1: true,
    isWebpack2: false,
    webpack: '1.14.0',
    extractText: '1.0.1',
    extractTextLoader: (extractTextPlugin, cssLoaders) => {
      return extractTextPlugin.extract('style-loader', cssLoaders);
    }
  },
  webpack2: {
    isWebpack1: false,
    isWebpack2: true,
    webpack: '2.2.1',
    extractText: '2.0.0-rc.3',
    extractTextLoader: (extractTextPlugin, cssLoaders) => {
      return extractTextPlugin.extract({
        fallback: 'style-loader',
        use: cssLoaders
      });
    }
  }
};

const selected = VERSIONS[process.env.VERSION];
if (selected) {
  setModuleVersion('webpack', selected.webpack, true);
  setModuleVersion('extract-text-webpack-plugin', selected.extractText, true);
} else {
  throw new Error(`Unknown webpack version '${process.env.VERSION}'`);
}

module.exports = selected;

