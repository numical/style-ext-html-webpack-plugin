'use strict';

const setModuleVersion = require('dynavers')('dynavers.json');

const VERSIONS = {
  webpack3: {
    major: 3,
    webpack: '3.12.0',
    htmlWebpackPlugin: "3.2.0",
    extractText: '3.0.2',
    extractTextLoader: (extractTextPlugin, cssLoaders) => {
      return extractTextPlugin.extract({
        fallback: 'style-loader',
        use: cssLoaders
      });
    }
  },
  webpack4: {
    major: 4,
    webpack: '4.35.2',
    htmlWebpackPlugin: "3.2.0",
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
  setModuleVersion('html-webpack-plugin', selected.htmlWebpackPlugin, true);
  setModuleVersion('extract-text-webpack-plugin', selected.extractText, true);
} else {
  throw new Error(`Unknown webpack version '${process.env.VERSION}'`);
}

selected.display = `webpack v${selected.webpack}, htmlWebpackPlugin v${selected.htmlWebpackPlugin}, extractTextWebpackPlugin v${selected.extractText}`;

module.exports = selected;
