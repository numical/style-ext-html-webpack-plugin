'use strict';

const webpack1 = {
  webpack: '1.13.2',
  extractText: '1.0.1',
  extractTextLoader: ['style-loader', 'css-loader']
};

const webpack2 = {
  webpack: '2.1.0-beta.20',
  extractText: '2.0.0-beta.4',
  extractTextLoader: {fallbackLoader: 'style-loader', loader: 'css-loader'}
};

module.exports = [webpack1, webpack2];
