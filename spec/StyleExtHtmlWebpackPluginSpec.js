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

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const rimraf = require('rimraf');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('../index.js');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

const OUTPUT_DIR = path.join(__dirname, '../dist');

function testPlugin (webpackConfig, expectedHtmlContent, expectedJsContent, done) {
  if (typeof expectedJsContent === 'function') {
    done = expectedJsContent;
    expectedJsContent = [];
  }
  webpack(webpackConfig, function (err, stats) {
    expect(err).toBeFalsy();
    const compilationErrors = (stats.compilation.errors || []).join('\n');
    expect(compilationErrors).toBe('');
    const compilationWarnings = (stats.compilation.warnings || []).join('\n');
    expect(compilationWarnings).toBe('');

    if (expectedHtmlContent.length > 0) {
      const htmlContent = getFileContent('index.html');
      if (htmlContent === null) {
        return done();
      }
      testContent(htmlContent, expectedHtmlContent);
    }

    if (expectedJsContent.length > 0) {
      const jsContent = getFileContent('index_bundle.js');
      if (jsContent === null) {
        return done();
      }
      testContent(jsContent, expectedJsContent);
    }
    done();
  });
}

function getFileContent (file) {
  const fileExists = fs.existsSync(path.join(OUTPUT_DIR, file));
  expect(fileExists).toBe(true);
  return fileExists ? fs.readFileSync(path.join(OUTPUT_DIR, file)).toString() : null;
}

function testContent (content, expectedContents) {
  expectedContents.forEach((expectedContent) => {
    if (expectedContent instanceof RegExp) {
      expect(content).toMatch(expectedContent);
    } else {
      expect(content).toContain(expectedContent);
    }
  });
}

describe('StyleExtHtmlWebpackPlugin', () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  it('inlines a single stylesheet', (done) => {
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

  it('inlines a single stylesheet with comments', (done) => {
    testPlugin(
      { entry: path.join(__dirname, 'fixtures/one_stylesheet_with_comments.js'),
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
      [/<style>[\s\S]*\/\u002a deliberate British spelling to be corrected by postcss processing \u002a\/[\s\S]*colour: grey;[\s\S]*<\/style>/],
      [/(removed by style-ext-html-webpack-plugin){1}/],
      done);
  });

  it('inlines multiple stylesheets from a single source', (done) => {
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

  it('inlines multiple stylesheets from multiple sources', (done) => {
    testPlugin(
      { entry: path.join(__dirname, 'fixtures/nested_stylesheets.js'),
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

  it('inlining works with postcss-loader', (done) => {
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

  it('inlining works alongside webpack css loaders', (done) => {
    testPlugin(
      { entry: path.join(__dirname, 'fixtures/two_stylesheets.js'),
        output: {
          path: OUTPUT_DIR,
          filename: 'index_bundle.js'
        },
        module: {
          loaders: [
            { test: /stylesheet1.css/, loader: StyleExtHtmlWebpackPlugin.inline() },
            { test: /stylesheet2.css/, loader: 'style-loader!css-loader' }
          ]
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new StyleExtHtmlWebpackPlugin()
        ]
      },
      // html contains first stylesheet content but none of the second
      [
        /<style>[\s\S]*background: snow;[\s\S]*<\/style>/,
        /^(?!.colour: grey)/
      ],
      // js contains second stylesheet content
      [
        /(removed by style-ext-html-webpack-plugin){1}/,
        /(colour: grey){1}/
      ],
      done);
  });

  it('inlining works alongside linked stylesheets', (done) => {
    testPlugin(
      { entry: path.join(__dirname, 'fixtures/two_stylesheets.js'),
        output: {
          path: OUTPUT_DIR,
          filename: 'index_bundle.js'
        },
        module: {
          loaders: [
            { test: /stylesheet1.css/, loader: StyleExtHtmlWebpackPlugin.inline() },
            { test: /stylesheet2.css/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader') }
          ]
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new StyleExtHtmlWebpackPlugin(),
          new ExtractTextPlugin('styles.css')
        ]
      },
      [/<link href="styles.css" rel="stylesheet">[\s\S]*<style>[\s\S]*background: snow;[\s\S]*<\/style>/],
      [
        /(removed by style-ext-html-webpack-plugin){1}/,
        /(removed by extract-text-webpack-plugin){1}/
      ],
      done);
  });

  it('inlining works alongside linked stylesheets - more general RegEx', (done) => {
    testPlugin(
      { entry: path.join(__dirname, 'fixtures/two_stylesheets.js'),
        output: {
          path: OUTPUT_DIR,
          filename: 'index_bundle.js'
        },
        module: {
          loaders: [
            { test: /stylesheet1\.css$/, loader: StyleExtHtmlWebpackPlugin.inline() },
            { test: /stylesheet[2-9]\.css$/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader') }
          ]
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new StyleExtHtmlWebpackPlugin(),
          new ExtractTextPlugin('styles.css')
        ]
      },
      [
        /<link href="styles.css" rel="stylesheet">[\s\S]*<style>[\s\S]*background: snow;[\s\S]*<\/style>/,
        /^(?!colour: grey)/
      ],
      [
        /(removed by style-ext-html-webpack-plugin){1}/,
        /(removed by extract-text-webpack-plugin){1}/
      ],
      done);
  });

  it('can minify a single stylesheet', (done) => {
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
          new StyleExtHtmlWebpackPlugin({minify: true})
        ]
      },
      [/<style>body{background:snow}<\/style>/],
      done);
  });

  it('can minify multiple stylesheets after post-css processing', (done) => {
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
          new StyleExtHtmlWebpackPlugin({minify: true})
        ]
      },
      // note US spelling
      [/<style>body{background:snow;color:gray}<\/style>/],
      done);
  });

  it('can pass minification options', (done) => {
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
          new StyleExtHtmlWebpackPlugin({
            minify: {
              keepBreaks: true // note: this is not chaning css-clean behaviour - to investigate
            }
          })
        ]
      },
      [/<style>body{background:snow}<\/style>/],
      done);
  });

  it('plays happily with other plugins using same html plugin event', (done) => {
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
          new StyleExtHtmlWebpackPlugin({
            minify: {
              keepBreaks: true // note: this is not chaning css-clean behaviour - to investigate
            }
          }),
          new ScriptExtHtmlWebpackPlugin({
            defaultAttribute: 'async'
          })
        ]
      },
      [
        /<style>body{background:snow}<\/style>/,
        /<script src="index_bundle.js" type="text\/javascript" async><\/script>/
      ],
      done);
  });

  it('works with template styles', (done) => {
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
          new HtmlWebpackPlugin({
            template: path.join(__dirname, 'fixtures/html.template')
          }),
          new StyleExtHtmlWebpackPlugin()
        ]
      },
      [
        /<style>[\s\S]*background: snow;[\s\S]*<\/style>/,
        /<style>div { background: blue }<\/style>/,
        /<div id='template_content'>/
      ],
      done);
  });
});
