/* eslint-env jasmine */
'use strict';

const path = require('path');
const version = require('./versions');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('../../index.js');

const baseOptions = Object.freeze({
  cssFilename: 'styles.css',
  cssLoaders: ['css-loader'],
  entry: 'one_stylesheet',
  htmlWebpackOptions: {
    hash: true,
    template: path.join(__dirname, '../fixtures/html_template.ejs')
  },
  outputDir: path.join(__dirname, '../../dist'),
  position: null,
  styleExtOptions: {}
});

const populateOptions = (options, defaultOptions) => {
  const defOptions = defaultOptions || {};
  switch (typeof options) {
    case 'undefined':
      return Object.assign({}, baseOptions, defOptions);
    case 'string':
      return Object.assign({}, baseOptions, defOptions, { entry: options });
    case 'object':
      return Object.assign({}, baseOptions, defOptions, options);
    default:
      throw new Error(`Invalid options ${options}`);
  }
};

const adaptForVersion = (config) => {
  switch (version.major) {
    case 4:
      config.mode = 'production';
      config.module.rules = config.module.loaders;
      delete config.module.loaders;
      return config;
    default:
      return config;
  }
};

const baseConfig = (options, defaultOptions) => {
  const opts = populateOptions(options, defaultOptions);
  const config = {
    entry: path.join(__dirname, `../fixtures/${opts.entry}.js`),
    output: {
      path: opts.outputDir,
      filename: 'index_bundle.js'
    },
    plugins: [
      new HtmlWebpackPlugin(opts.htmlWebpackOptions),
      version.extractPlugin.create(opts.cssFilename),
      new StyleExtHtmlWebpackPlugin(opts.styleExtOptions)
    ],
    module: {
      loaders: [
        {
          test: /\.css$/,
          loader: version.extractPlugin.loader(opts.cssLoaders)
        }
      ]
    }
  };
  return adaptForVersion(config);
};

const multiEntryConfig = () => {
  const { create, loader } = version.extractPlugin;
  const page1Extract = create('page1.css');
  const page2Extract = create('page2.css');
  const page1Loader = loader(['css-loader'], page1Extract);
  const page2Loader = loader(['css-loader'], page2Extract);
  const config = baseConfig('');
  config.entry = {
    page1: path.join(__dirname, '../fixtures/page1/script.js'),
    page2: path.join(__dirname, '../fixtures/page2/script.js')
  };
  config.output.filename = '[name].js';
  config.module.loaders = [
    {
      test: /\.css$/,
      loader: page1Loader,
      include: [
        path.resolve(__dirname, '../fixtures/page1')
      ]
    },
    {
      test: /\.css$/,
      loader: page2Loader,
      include: [
        path.resolve(__dirname, '../fixtures/page2')
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
  return adaptForVersion(config);
};

module.exports = {
  baseConfig,
  multiEntryConfig
};
