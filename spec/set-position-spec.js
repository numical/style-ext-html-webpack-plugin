/* eslint-env jasmine */
'use strict';

const rimraf = require('rimraf');
const path = require('path');
const version = require('./helpers/versions');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('../index.js');
const mainTests = require('./helpers/main-tests.js');
const testPlugin = require('./helpers/core-test.js');
const expectations = require('./expectations.js');

const OUTPUT_DIR = path.join(__dirname, '../dist');

const baseConfig = (entry, cssFilename, cssLoaders, position) => {
  cssFilename = cssFilename || 'styles.css';
  cssLoaders = cssLoaders || ['css-loader'];
  position = position || 'head-bottom';
  return {
    entry: path.join(__dirname, `fixtures/${entry}.js`),
    output: {
      path: OUTPUT_DIR,
      filename: 'index_bundle.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        hash: true,
        inject: false
      }),
      new ExtractTextPlugin(cssFilename),
      new StyleExtHtmlWebpackPlugin({
        position: position
      })
    ],
    module: {
      loaders: [
        {
          test: /\.css$/,
          loader: version.extractTextLoader(ExtractTextPlugin, cssLoaders)
        }
      ]
    }
  };
};

const multiEntryConfig = (position) => {
  position = position || 'head-bottom';
  const page1Extract = new ExtractTextPlugin('page1.css');
  const page2Extract = new ExtractTextPlugin('page2.css');
  const page1Loader = version.extractTextLoader(page1Extract, ['css-loader']);
  const page2Loader = version.extractTextLoader(page2Extract, ['css-loader']);
  const config = baseConfig('');
  config.entry = {
    page1: path.join(__dirname, 'fixtures/page1/script.js'),
    page2: path.join(__dirname, 'fixtures/page2/script.js')
  };
  config.output.filename = '[name].js';
  config.module.loaders = [
    {
      test: /\.css$/,
      loader: page1Loader,
      include: [
        path.resolve(__dirname, 'fixtures/page1')
      ]
    },
    {
      test: /\.css$/,
      loader: page2Loader,
      include: [
        path.resolve(__dirname, 'fixtures/page2')
      ]
    }
  ];
  config.plugins = [
    new HtmlWebpackPlugin({
      hash: true,
      inject: false,
      chunks: ['page1'],
      filename: 'page1.html'
    }),
    new HtmlWebpackPlugin({
      hash: true,
      inject: false,
      chunks: ['page2'],
      filename: 'page2.html'
    }),
    page1Extract,
    page2Extract,
    new StyleExtHtmlWebpackPlugin({
      position: position,
      chunks: ['page1']
    }),
    new StyleExtHtmlWebpackPlugin({
      position: position,
      chunks: ['page2']
    })
  ];
  return config;
};

describe(`Explicitly Setting Position (webpack ${version.webpack})`, () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  mainTests(baseConfig, expectations.base, multiEntryConfig, expectations.multiEntry);

  it('positions correctly at bottom of head', done => {
    const config = baseConfig('one_stylesheet', null, null, 'head-bottom');
    const expected = expectations.base();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style><\/head>/
    ];
    testPlugin(config, expected, done);
  });

  it('positions correctly at top of head', done => {
    const config = baseConfig('one_stylesheet', null, null, 'head-top');
    const expected = expectations.base();
    expected.html = [
      /<head><style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('positions correctly at bottom of body', done => {
    const config = baseConfig('one_stylesheet', null, null, 'body-bottom');
    const expected = expectations.base();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style><\/body>/
    ];
    testPlugin(config, expected, done);
  });

  it('positions correctly at top of body', done => {
    const config = baseConfig('one_stylesheet', null, null, 'body-top');
    const expected = expectations.base();
    expected.html = [
      /<body><style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });
});
