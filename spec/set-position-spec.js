/* eslint-env jasmine */
'use strict';

const rimraf = require('rimraf');
const path = require('path');
const version = require('./helpers/versions');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('../index.js');
const mainTests = require('./helpers/main-tests.js');
const testPlugin = require('./helpers/core-test.js');
const { baseConfig } = require('./helpers/configs.js');
const expectations = require('./expectations.js');

const OUTPUT_DIR = path.join(__dirname, '../dist');
const defaultOptions = {
  htmlWebpackOptions: {
    hash: true,
    inject: false
  },
  styleExtOptions: {
    position: 'head-bottom'
  }
};

const multiEntryConfig = (position) => {
  position = position || 'head-bottom';
  const { create, loader } = version.extractPlugin;
  const page1Extract = create('page1.css');
  const page2Extract = create('page2.css');
  const page1Loader = loader(['css-loader'], page1Extract);
  const page2Loader = loader(['css-loader'], page2Extract);
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

describe(`Explicitly Setting Position (webpack ${version.display})`, () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  mainTests(defaultOptions, expectations.base, multiEntryConfig, expectations.multiEntry);

  it('positions correctly at bottom of head', done => {
    const config = baseConfig('one_stylesheet', defaultOptions);
    const expected = expectations.base();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style><\/head>/
    ];
    testPlugin(config, expected, done);
  });

  it('positions correctly at top of head', done => {
    const config = baseConfig('one_stylesheet', {
      htmlWebpackOptions: {
        hash: true,
        inject: false
      },
      styleExtOptions: {
        position: 'head-top'
      }
    });
    const expected = expectations.base();
    expected.html = [
      /<head><style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('positions correctly at bottom of body', done => {
    const config = baseConfig('one_stylesheet', {
      htmlWebpackOptions: {
        hash: true,
        inject: false
      },
      styleExtOptions: {
        position: 'body-bottom'
      }
    });
    const expected = expectations.base();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style><\/body>/
    ];
    testPlugin(config, expected, done);
  });

  it('positions correctly at top of body', done => {
    const config = baseConfig('one_stylesheet', {
      htmlWebpackOptions: {
        hash: true,
        inject: false
      },
      styleExtOptions: {
        position: 'body-top'
      }
    });
    const expected = expectations.base();
    expected.html = [
      /<body><style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });
});
