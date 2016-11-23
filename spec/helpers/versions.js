'use strict';

const webpack1 = {
  webpack: '1.13.3',
  extractText: '1.0.1',
  extractTextLoader: (ExtractTextPlugin) => {
    return ExtractTextPlugin.extract('style-loader', 'css-loader');
  }
};

const webpack2 = {
  webpack: '2.1.0-beta.27',
  extractText: '2.0.0-beta.4',
  extractTextLoader: (ExtractTextPlugin) => {
    return ExtractTextPlugin.extract({
      fallbackLoader: 'style-loader',
      loader: 'css-loader'}
    );
  }
};

module.exports = [webpack1, webpack2];
module.exports.webpack1 = webpack1;
module.exports.webpack2 = webpack2;
