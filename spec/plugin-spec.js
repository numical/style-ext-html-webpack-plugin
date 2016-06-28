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
const multidepRequire = require('multidep')('spec/multidep.json');
const rimraf = require('rimraf');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('../index.js');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

const OUTPUT_DIR = path.join(__dirname, '../dist');

function testPlugin (webpack, webpackConfig, expectedHtmlContent, expectedJsContent, done) {
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

function appendVersion (s, version) {
  return s + ' (wepback v' + version + ')';
}

describe('Plugin functionality: ', () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  multidepRequire.forEachVersion('webpack', function (version, webpack) {
    it(appendVersion('inlines a single stylesheet', version), (done) => {
      testPlugin(
        webpack,
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

    it(appendVersion('inlines a single tricky stylesheet', version), (done) => {
      testPlugin(
        webpack,
        { entry: path.join(__dirname, 'fixtures/one_tricky_stylesheet.js'),
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
        [
          /<style>[\s\S]*\/\u002a import statements[\s\S]*\u0040import url\("https:\/\/fonts.googleapis.com\/css\?family=Indie\+Flower"[\s\S]*<\/style>/,
          /<style>[\s\S]*\/\u002a deliberate British spelling to be corrected by postcss processing \u002a\/[\s\S]*colour: grey;[\s\S]*<\/style>/,
          /<style>[\s\S]*\[contenteditable='true'\][\s\S]*<\/style>/
        ],
        [/(removed by style-ext-html-webpack-plugin){1}/],
        done);
    });

    it(appendVersion('inlines multiple stylesheets from a single source', version), (done) => {
      testPlugin(
        webpack,
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

    it(appendVersion('inlines multiple stylesheets from multiple sources', version), (done) => {
      testPlugin(
        webpack,
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

    it(appendVersion('inlining works with postcss-loader', version), (done) => {
      testPlugin(
        webpack,
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

    it(appendVersion('inlining works alongside webpack css loaders', version), (done) => {
      testPlugin(
        webpack,
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

    it(appendVersion('inlining works alongside linked stylesheets', version), (done) => {
      testPlugin(
        webpack,
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

    it(appendVersion('inlining works alongside linked stylesheets - more general RegEx', version), (done) => {
      testPlugin(
        webpack,
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

    it(appendVersion('can minify a single stylesheet', version), (done) => {
      testPlugin(
        webpack,
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
            new StyleExtHtmlWebpackPlugin({minify: {processImport: false}})
          ]
        },
        [/<style>body{background:snow}<\/style>/],
        done);
    });

    it(appendVersion('can minify multiple stylesheets after post-css processing', version), (done) => {
      testPlugin(
        webpack,
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
            new StyleExtHtmlWebpackPlugin({minify: {processImport: false}})
          ]
        },
        // note US spelling
        [/<style>body{background:snow;color:gray}[\s\S]*Indie\+Flower[\s\S]*\[contenteditable=true\]:active,\[contenteditable=true\]:focus{border:none}<\/style>/],
        done);
    });

    it(appendVersion('can pass minification options', version), (done) => {
      testPlugin(
        webpack,
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
                keepBreaks: true // note: this is not chaining css-clean behaviour - to investigate
              }
            })
          ]
        },
        [/<style>body{background:snow}<\/style>/],
        done);
    });

    it(appendVersion('plays happily with other plugins using same html plugin event', version), (done) => {
      testPlugin(
        webpack,
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

    it(appendVersion('works with template styles', version), (done) => {
      testPlugin(
        webpack,
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
});
