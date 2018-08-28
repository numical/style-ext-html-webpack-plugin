'use strict';

const setModuleVersion = require('dynavers')('dynavers.json');

const VERSIONS = {
  webpack1: {
    isWebpack1: true,
    webpack: '1.15.0',
    extractText: '1.0.1',
    extractTextLoader: (extractTextPlugin, cssLoaders) => {
      return extractTextPlugin.extract('style-loader', cssLoaders);
    }
  },
  webpack2: {
    isWebpack1: false,
    webpack: '2.7.0',
    extractText: '2.1.2',
    extractTextLoader: (extractTextPlugin, cssLoaders) => {
      return extractTextPlugin.extract({
        fallback: 'style-loader',
        use: cssLoaders
      });
    }
  },
  webpack3: {
    isWebpack1: false,
    webpack: '3.12.0',
    extractText: '3.0.2',
    extractTextLoader: (extractTextPlugin, cssLoaders) => {
      return extractTextPlugin.extract({
        fallback: 'style-loader',
        use: cssLoaders
      });
    }
  },
  webpack4: {
    isWebpack1: false,
    webpack: '4.17.1',
    extractText: '4.0.0-beta.0',
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
