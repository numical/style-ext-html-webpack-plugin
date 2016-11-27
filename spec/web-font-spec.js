/* eslint-env jasmine */
'use strict';

const path = require('path');
const setModuleVersion = require('dynavers')('dynavers.json');
const rimraf = require('rimraf');
const StyleExtHtmlWebpackPlugin = require('../index.js');
const testPlugin = require('./helpers/testPlugin.js');

const version = require('./helpers/versions').webpack2;
setModuleVersion('webpack', version.webpack, true);
setModuleVersion('extract-text-webpack-plugin', version.extractText, true);
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');

const OUTPUT_DIR = path.join(__dirname, '../dist');

const baseConfig = () => {
  return {
    entry: path.join(__dirname, 'fixtures/one_stylesheet_with_web_font.js'),
    output: {
      path: OUTPUT_DIR,
      filename: 'index_bundle.js'
    },
    plugins: [
      new HtmlWebpackPlugin(),
      new ExtractTextWebpackPlugin('styles.css')
    ],
    module: {
      loaders: [
        {
          test: /\.css$/,
          loader: ExtractTextWebpackPlugin.extract({
            fallbackLoader: 'style-loader',
            loader: 'css-loader'
          })
        },
        {
          test: /\.woff2$/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: '[name].[ext]'
          }
        }
      ]
    }
  };
};

const baseExpectations = () => {
  return {
    html: [],
    js: [],
    files: [],
    not: {
      html: [],
      js: [],
      files: []
    }
  };
};

describe('Web font functionality: ', () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  it('works with ExtractText', (done) => {
    const config = baseConfig();
    const expected = baseExpectations();
    expected.not.html = [
      /<style>[\s\S]*font-face[\s\S]*Indie-Flower[\s\S]*<\/style>/
    ];
    expected.js = [
      /(removed by extract-text-webpack-plugin){1}/
    ];
    expected.files = [
      'styles.css',
      'Indie-Flower.woff2'
    ];
    testPlugin(webpack, config, expected, done);
  });

  it('works with StyleExt', (done) => {
    const config = baseConfig();
    config.plugins.push(new StyleExtHtmlWebpackPlugin('styles.css'));
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*font-face[\s\S]*Indie-Flower[\s\S]*<\/style>/
    ];
    expected.js = [
      /(removed by extract-text-webpack-plugin){1}/
    ];
    expected.files = [
      'Indie-Flower.woff2'
    ];
    expected.not.files = [
      'styles.css'
    ];
    testPlugin(webpack, config, expected, done);
  });
});
