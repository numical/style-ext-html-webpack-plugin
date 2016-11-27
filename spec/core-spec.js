/* eslint-env jasmine */
'use strict';

const path = require('path');
const rimraf = require('rimraf');
const StyleExtHtmlWebpackPlugin = require('../index.js');
const testPlugin = require('./helpers/testPlugin.js');

const version = require('./helpers/versions');
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
          loader: version.extractTextLoader(ExtractTextWebpackPlugin)
        },
        {
          test: /\.woff2$/,
          loader: 'file-loader?name=[name].[ext]'
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

describe(`Core functionality (webpack ${version.webpack})`, () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  it('vanilla ExtractText works', (done) => {
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

  it('works with web fonts', (done) => {
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
