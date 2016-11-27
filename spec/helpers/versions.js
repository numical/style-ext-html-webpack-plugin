'use strict';

const setModuleVersion = require('dynavers')('dynavers.json');

const VERSIONS = {
  webpack1: {
    webpack: '1.13.3',
    extractText: '1.0.1',
    extractTextLoader: (ExtractTextPlugin) => {
      return ExtractTextPlugin.extract('style-loader', 'css-loader');
    }
  },
  webpack2: {
    webpack: '2.1.0-beta.27',
    extractText: '2.0.0-beta.4',
    extractTextLoader: (ExtractTextPlugin) => {
      return ExtractTextPlugin.extract({
        fallbackLoader: 'style-loader',
        loader: 'css-loader'}
      );
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

