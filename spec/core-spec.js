/* eslint-env jasmine */
'use strict';

const path = require('path');
const setModuleVersion = require('dynavers')('dynavers.json');
const rimraf = require('rimraf');
const StyleExtHtmlWebpackPlugin = require('../index.js');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const testPlugin = require('./helpers/testPlugin.js');

const WEBPACK_VERSIONS = require('./helpers/webpackVersions');
const RUNTIME_COMMENT = require('../constants.js').REGEXPS.RUNTIME_COMMENT;
const OUTPUT_DIR = path.join(__dirname, '../dist');

describe('Core functionality: ', () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  WEBPACK_VERSIONS.forEach(webpackVersion => {
    setModuleVersion('webpack', webpackVersion, true);
    var webpack = require('webpack');
    var HtmlWebpackPlugin = require('html-webpack-plugin');

    describe('Webpack v' + webpackVersion + ':', () => {
      it('inlines a single stylesheet', (done) => {
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
          [RUNTIME_COMMENT],
          done);
      });

      it('inlines a single tricky stylesheet', (done) => {
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
          [RUNTIME_COMMENT],
          done);
      });

      it('inlines multiple stylesheets from a single source', (done) => {
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
          [RUNTIME_COMMENT],
          done);
      });

      it('inlines multiple stylesheets from multiple sources', (done) => {
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
          [RUNTIME_COMMENT],
          done);
      });

      it('inlining works with postcss-loader', (done) => {
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

      it('inlining works alongside webpack css loaders', (done) => {
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
            RUNTIME_COMMENT,
            /(colour: grey){1}/
          ],
          done);
      });

      it('can minify a single stylesheet', (done) => {
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

      it('can minify multiple stylesheets after post-css processing', (done) => {
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

      it('can pass minification options', (done) => {
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

      it('plays happily with other plugins using same html plugin event', (done) => {
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

      it('works with template styles', (done) => {
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
});
