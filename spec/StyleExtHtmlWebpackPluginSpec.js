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

function testPlugin (webpackConfig, expectedHtmlContent, expectedJsContent, done) {
  if (typeof expectedJsContent === 'function') {
    done = expectedJsContent;
    expectedJsContent = [];
  }
  webpack(webpackConfig, function (err, stats) {
    expect(err).toBeFalsy();
    var compilationErrors = (stats.compilation.errors || []).join('\n');
    expect(compilationErrors).toBe('');
    var compilationWarnings = (stats.compilation.warnings || []).join('\n');
    expect(compilationWarnings).toBe('');

    if (expectedHtmlContent.length > 0) {
      var htmlContent = getFileContent('index.html');
      if (htmlContent === null) {
        return done();
      }
      testContent(htmlContent, expectedHtmlContent);
    }

    if (expectedJsContent.length > 0) {
      var jsContent = getFileContent('index_bundle.js');
      if (jsContent === null) {
        return done();
      }
      testContent(jsContent, expectedJsContent);
    }
    done();
  });
}

function getFileContent (file) {
  var fileExists = fs.existsSync(path.join(OUTPUT_DIR, file));
  expect(fileExists).toBe(true);
  return fileExists ? fs.readFileSync(path.join(OUTPUT_DIR, file)).toString() : null;
}

function testContent (content, expectedContents) {
  expectedContents.forEach(function (expectedContent) {
    if (expectedContent instanceof RegExp) {
      expect(content).toMatch(expectedContent);
    } else {
      expect(content).toContain(expectedContent);
    }
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
      [/(removed by style-ext-html-webpack-plugin){1}/],
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
      [/(removed by style-ext-html-webpack-plugin){1}/],
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
      // note British spelling converted to US spelling
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
      [/(removed by style-ext-html-webpack-plugin){1}/, /(background: snow){1}/],
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
      [/(removed by style-ext-html-webpack-plugin){1}/, /(removed by extract-text-webpack-plugin){1}/],
      done);
  });

  it('inlined stylesheets can be minified', function (done) {
    done();
  });
});
