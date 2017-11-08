/* eslint-env jasmine */
'use strict';

const rimraf = require('rimraf');
const path = require('path');
const version = require('./helpers/versions');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('../index.js');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const testPlugin = require('./helpers/core-test.js');
const mainTests = require('./helpers/main-tests.js');
const expectations = require('./expectations.js');

const OUTPUT_DIR = path.join(__dirname, '../dist');

const baseConfig = (entry, cssFilename, cssLoaders) => {
  cssFilename = cssFilename || 'styles.css';
  cssLoaders = cssLoaders || ['css-loader'];
  return {
    entry: path.join(__dirname, `fixtures/${entry}.js`),
    output: {
      path: OUTPUT_DIR,
      filename: 'index_bundle.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        hash: true,
        template: path.join(__dirname, 'fixtures/html_template.ejs')
      }),
      new ExtractTextPlugin(cssFilename),
      new StyleExtHtmlWebpackPlugin()
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

const multiEntryConfig = () => {
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
      chunks: ['page1'],
      filename: 'page1.html'
    }),
    new HtmlWebpackPlugin({
      hash: true,
      chunks: ['page2'],
      filename: 'page2.html'
    }),
    page1Extract,
    page2Extract,
    new StyleExtHtmlWebpackPlugin({
      chunks: ['page1']
    }),
    new StyleExtHtmlWebpackPlugin({
      chunks: ['page2']
    })
  ];
  return config;
};

describe(`Core Functionality (webpack ${version.webpack})`, () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  mainTests(baseConfig, expectations.base, multiEntryConfig, expectations.multiEntry);

  it('plays happily with other plugins using same html plugin event', done => {
    const config = baseConfig('one_stylesheet');
    config.plugins.push(new ScriptExtHtmlWebpackPlugin({
      defaultAttribute: 'async'
    }));
    const expected = expectations.base();
    expected.html = [
      /<script type="text\/javascript" src="index_bundle.js[?]?[\S]*" async><\/script>/,
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });
});
