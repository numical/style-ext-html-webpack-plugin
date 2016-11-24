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

const RUNTIME_COMMENT = require('../lib/constants.js').REGEXPS.RUNTIME_COMMENT;
const OUTPUT_DIR = path.join(__dirname, '../dist');

const baseConfig = (stylesheet) => {
  return {
    entry: path.join(__dirname, 'fixtures/' + stylesheet),
    output: {
      path: OUTPUT_DIR,
      filename: 'index_bundle.js'
    }
  };
};

const buildConfig = function () {
  return Object.assign.apply({}, arguments);
};

describe('Web font functionality: ', () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  fit('works with ExtractText', (done) => {
    testPlugin(
      webpack,
      buildConfig(
        baseConfig('one_stylesheet_with_web_font.js'),
        {
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
        }
      ),
      [],
      [
        /(removed by extract-text-webpack-plugin){1}/
      ],
      [
        'styles.css',
        'Indie-Flower.woff2'
      ],
    done);
  });

  it('works with StyleExt', (done) => {
    testPlugin(
      webpack,
      buildConfig(
        baseConfig('one_stylesheet_with_web_font.js'),
        {
          plugins: [
            new HtmlWebpackPlugin(),
            new StyleExtHtmlWebpackPlugin()
          ],
          module: {
            loaders: [
              {
                test: /\.css$/,
                loader: StyleExtHtmlWebpackPlugin.inline()
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
        }
      ),
      [
        /<style>[\s\S]*font-face[\s\S]*Indie-Flower[\s\S]*<\/style>/
      ],
      [RUNTIME_COMMENT],
      [
        'Indie-Flower.woff2'
      ],
    done);
  });
});
