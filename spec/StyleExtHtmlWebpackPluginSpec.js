/* eslint-env jasmine */
'use strict';

// Workaround for css-loader issue
// https://github.com/webpack/css-loader/issues/144
if (!global.Promise) {
  require('es6-promise').polyfill();
}

// for debugging
if (typeof v8debug === 'object') {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
}

var path = require('path');
var fs = require('fs');
var webpack = require('webpack');
var rm_rf = require('rimraf');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var StyleExtHtmlWebpackPlugin = require('../index.js');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var OUTPUT_DIR = path.join(__dirname, '../dist');

function testPlugin (webpackConfig, expectedResults, done, showHtml) {
  var outputFile = 'index.html';
  webpack(webpackConfig, function (err, stats) {
    expect(err).toBeFalsy();
    var compilationErrors = (stats.compilation.errors || []).join('\n');
    expect(compilationErrors).toBe('');
    var compilationWarnings = (stats.compilation.warnings || []).join('\n');
    expect(compilationWarnings).toBe('');
    var outputFileExists = fs.existsSync(path.join(OUTPUT_DIR, outputFile));
    expect(outputFileExists).toBe(true);
    if (!outputFileExists) {
      return done();
    }
    var htmlContent = fs.readFileSync(path.join(OUTPUT_DIR, outputFile)).toString();
    if (showHtml) {
      console.log(htmlContent);
    }
    for (var i = 0; i < expectedResults.length; i++) {
      var expectedResult = expectedResults[i];
      if (expectedResult instanceof RegExp) {
        expect(htmlContent).toMatch(expectedResult);
      } else {
        expect(htmlContent).toContain(expectedResult);
      }
    }
    done();
  });
}

describe('StyleExtHtmlWebpackPlugin', function () {
  beforeEach(function (done) {
    rm_rf(OUTPUT_DIR, done);
  });

  it('inlines a single stylesheet', function (done) {
    testPlugin(
      { entry: path.join(__dirname, 'fixtures/one_stylesheet.js'),
        output: {
          path: OUTPUT_DIR,
          filename: 'index_bundle.js'
        },
        module: {
          loaders: [
            {test: /\.css$/, loader: StyleExtHtmlWebpackPlugin.inline()}
          ]
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new StyleExtHtmlWebpackPlugin()
        ]
      },
      [/<style>[\s\S]*background: snow;[\s\S]*<\/style>/],
      done);
  });

  it('inlines multiple stylesheets', function (done) {
    testPlugin(
      { entry: path.join(__dirname, 'fixtures/two_stylesheets.js'),
        output: {
          path: OUTPUT_DIR,
          filename: 'index_bundle.js'
        },
        module: {
          loaders: [
            {test: /\.css$/, loader: StyleExtHtmlWebpackPlugin.inline()}
          ]
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new StyleExtHtmlWebpackPlugin()
        ]
      },
      // note British spelling
      [/<style>[\s\S]*background: snow;[\s\S]*colour: grey;[\s\S]*<\/style>/],
      done);
  });

  it('inlining works with postcss-loader', function (done) {
    testPlugin(
      { entry: path.join(__dirname, 'fixtures/two_stylesheets.js'),
        output: {
          path: OUTPUT_DIR,
          filename: 'index_bundle.js'
        },
        module: {
          loaders: [
            {test: /\.css$/, loader: StyleExtHtmlWebpackPlugin.inline('postcss-loader')}
          ]
        },
        postcss: [
          require('postcss-spiffing')
        ],
        plugins: [
          new HtmlWebpackPlugin(),
          new StyleExtHtmlWebpackPlugin()
        ]
      },
      // note US spelling
      [/<style>[\s\S]*background: snow;[\s\S]*color: gray;[\s\S]*<\/style>/],
      done);
  });

  it('inlining works alongside webpack css loaders', function (done) {
    testPlugin(
      { entry: path.join(__dirname, 'fixtures/two_stylesheets.js'),
        output: {
          path: OUTPUT_DIR,
          filename: 'index_bundle.js'
        },
        module: {
          loaders: [
            { test: /stylesheet1.css/, loader: 'style-loader!css-loader' },
            { test: /stylesheet2.css/, loader: StyleExtHtmlWebpackPlugin.inline() }
          ]
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new StyleExtHtmlWebpackPlugin()
        ]
      },
      // contains second stylesheet content but none of the first
      [/<style>[\s\S]*colour: grey;[\s\S]*<\/style>/, /^(?!.background: snow)/],
      done);
  });

  it('inlining works alongside linked stylesheets', function (done) {
    testPlugin(
      { entry: path.join(__dirname, 'fixtures/two_stylesheets.js'),
        output: {
          path: OUTPUT_DIR,
          filename: 'index_bundle.js'
        },
        module: {
          loaders: [
            { test: /stylesheet1.css/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader') },
            { test: /stylesheet2.css/, loader: StyleExtHtmlWebpackPlugin.inline() }
          ]
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new ExtractTextPlugin('styles.css'),
          new StyleExtHtmlWebpackPlugin()
        ]
      },
      [/<link href="styles.css" rel="stylesheet">[\s\S]*<style>[\s\S]*colour: grey;[\s\S]*<\/style>/],
      done);
  });

  it('inlined stylesheets can be minified', function (done) {
    done();
  });
});
