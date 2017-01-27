/* eslint-env jasmine */
'use strict';

const path = require('path');
const rimraf = require('rimraf');
const version = require('./helpers/versions');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('../index.js');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const testPlugin = require('./helpers/core-test.js');
const testMultiEntry = require('./helpers/multi-entry-test.js');

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
      new HtmlWebpackPlugin(),
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
      chunks: ['page1'],
      filename: 'page1.html'
    }),
    new HtmlWebpackPlugin({
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

const baseExpectations = () => {
  return {
    html: [],
    js: [],
    files: [],
    not: {
      html: [],
      js: [],
      files: ['styles.css']
    }
  };
};

const multiEntryExpectations = () => {
  const expected1 = baseExpectations();
  expected1.html = [
    /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
  ];
  expected1.not.html = [
    /<style>[\s\S]*\u0040import url\(https:\/\/fonts.googleapis.com\/css\?family=Indie\+Flower[\s\S]*<\/style>/,
    /<style>[\s\S]*colour: grey;[\s\S]*<\/style>/,
    /<style>[\s\S]*\[contenteditable='true'][\s\S]*<\/style>/
  ];
  const expected2 = baseExpectations();
  expected2.html = [
    /<style>[\s\S]*\u0040import url\(https:\/\/fonts.googleapis.com\/css\?family=Indie\+Flower[\s\S]*<\/style>/,
    /<style>[\s\S]*colour: grey;[\s\S]*<\/style>/,
    /<style>[\s\S]*\[contenteditable='true'][\s\S]*<\/style>/
  ];
  expected2.not.html = [
    /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
  ];
  const entries = [
    {
      htmlFile: 'page1.html',
      expected: expected1
    },
    {
      htmlFile: 'page2.html',
      expected: expected2
    }
  ];
  return entries;
};

describe(`Core functionality (webpack ${version.webpack})`, () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  it('inlines a single stylesheet', done => {
    const config = baseConfig('one_stylesheet');
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('inlines a single stylesheet with quoted attributes and an import url', done => {
    const config = baseConfig('one_tricky_stylesheet');
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*\u0040import url\(https:\/\/fonts.googleapis.com\/css\?family=Indie\+Flower[\s\S]*<\/style>/,
      /<style>[\s\S]*colour: grey;[\s\S]*<\/style>/,
      /<style>[\s\S]*\[contenteditable='true'][\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('inlines multiple stylesheets from a single source', done => {
    const config = baseConfig('two_stylesheets');
    const expected = baseExpectations();
    expected.html = [
      // note British spelling
      /<style>[\s\S]*background: snow;[\s\S]*colour: grey;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('inlines multiple stylesheets from multiple sources', done => {
    const config = baseConfig('nested_stylesheets');
    const expected = baseExpectations();
    expected.html = [
      // note British spelling
      /<style>[\s\S]*background: snow;[\s\S]*colour: grey;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('inlining works with postcss-loader', done => {
    const config = baseConfig('two_stylesheets', 'styles.css', ['css-loader', 'postcss-loader']);
    const expected = baseExpectations();
    expected.html = [
      // note British speeling cnverted to American spelling
      /<style>[\s\S]*background: snow;[\s\S]*color: gray;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('inlining works alongside webpack css loaders', done => {
    const config = baseConfig('two_stylesheets');
    config.module.loaders = [
      {
        test: /stylesheet1.css/,
        loader: version.extractTextLoader(ExtractTextPlugin, ['css-loader'])
      },
      {
        test: /stylesheet2.css/,
        loader: 'style-loader!css-loader'
      }
    ];
    const expected = baseExpectations();
    // html contains fist stylesheet content but none of second
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    expected.not.html = [
      /<style>[\s\S]*colour: grey[/s/S]*/
    ];
    // js contains second stylesheet content
    expected.js = [
      /(colour: grey){1}/
    ];
    testPlugin(config, expected, done);
  });

  it('vanilla ExtractText works with local web font', (done) => {
    const config = baseConfig('one_stylesheet_with_web_font');
    config.plugins.pop(); // removes StyleExt plugin
    config.module.loaders.push(  // add file loader for local font file
      {
        test: /\.woff2$/,
        loader: 'file-loader?name=[name].[ext]'
      }
        );
    const expected = baseExpectations();
    expected.not.html = [
      /<style>[\s\S]*font-face[\s\S]*Indie-Flower[\s\S]*<\/style>/
    ];
    expected.files = [
      'styles.css',
      'Indie-Flower.woff2'
    ];
    expected.not.files = [];
    testPlugin(config, expected, done);
  });

  it('works with web fonts', (done) => {
    const config = baseConfig('one_stylesheet_with_web_font');
    config.module.loaders.push(  // add file loader for local font file
      {
        test: /\.woff2$/,
        loader: 'file-loader?name=[name].[ext]'
      }
        );
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*font-face[\s\S]*Indie-Flower[\s\S]*<\/style>/
    ];
    expected.files = [
      'Indie-Flower.woff2'
    ];
    testPlugin(config, expected, done);
  });

  it('plays happily with other plugins using same html plugin event', done => {
    const config = baseConfig('one_stylesheet');
    config.plugins.push(new ScriptExtHtmlWebpackPlugin({
      defaultAttribute: 'async'
    }));
    const expected = baseExpectations();
    expected.html = [
      /<script type="text\/javascript" src="index_bundle.js" async><\/script>/,
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('works with html webpack plugin template styles', done => {
    const config = baseConfig('one_stylesheet');
    // replace base HtmlWebpackPlugin
    config.plugins[0] = new HtmlWebpackPlugin({
      template: path.join(__dirname, 'fixtures/html.template')
    });
    const expected = baseExpectations();
    expected.html = [
      /<style[\s\S]*background: snow;[\s\S]*<\/style>/,
      /<style>div { background: blue }<\/style>/,
      /<div id='template_content'>/
    ];
    testPlugin(config, expected, done);
  });

  if (version.isWebpack1) {
    it('works with UglifyJsPlugin to minimize css', done => {
      const config = baseConfig('two_stylesheets');
      config.plugins.push(new webpack.optimize.UglifyJsPlugin());
      const expected = baseExpectations();
      // note spaces and unnecessary symbols have been removed
      expected.html = [
        /<style>[\s\S]*body{background:snow}body{colour:grey}[\s\S]*<\/style>/
      ];
      testPlugin(config, expected, done);
    });
  }

  if (version.isWebpack2) {
    it('works with LoaderOptionsPlugin to minimize css', done => {
      const config = baseConfig('two_stylesheets');
      config.plugins.push(new webpack.LoaderOptionsPlugin({minimize: true}));
      const expected = baseExpectations();
      // note spaces and unnecessary symbols have been removed
      expected.html = [
        /<style>[\s\S]*body{background:snow}body{colour:grey}[\s\S]*<\/style>/
      ];
      testPlugin(config, expected, done);
    });
  }

  it('vanilla ExtractText handles [name] and [id] in css filename', done => {
    const config = baseConfig('one_stylesheet', '[name][id].css');
    config.plugins.pop(); // remove StyleExt
    const expected = baseExpectations();
    expected.not.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    // default chunk name and id
    expected.files = [
      'main0.css'
    ];
    testPlugin(config, expected, done);
  });

  // Note: why on earth test this? For people who simply add StyleExt to an existing
  // configuration with ExtractTextWebpackPlugin already in it
  it('handles [name] and [id] in css filename', done => {
    const config = baseConfig('one_stylesheet', '[name][id].css');
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    expected.not.files = [
      'main0.css'
    ];
    testPlugin(config, expected, done);
  });

  // Note: why on earth test this? For people who simply add StyleExt to an existing
  // configuration with ExtractTextWebpackPlugin already in it
  it('handles [contenthash] in css filename', done => {
    const config = baseConfig('one_stylesheet', '[contenthash].css');
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  // Note: why on earth test this? For people who simply add StyleExt to an existing
  // configuration with ExtractTextWebpackPlugin already in it
  it('handles nested css filename', done => {
    const config = baseConfig('one_stylesheet', 'css/styles.css');
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    expected.not.files = [
      'styles.css',
      'css/styles.css'
    ];
    testPlugin(config, expected, done);
  });

  it('can be targeted at one of multiple ExtractText outputs', done => {
    const toBeExtracted = new ExtractTextPlugin('toBeExtracted.css');
    const toBeIgnored = new ExtractTextPlugin('toBeIgnored.css');
    const config = baseConfig('two_stylesheets');
    config.plugins = [
      new HtmlWebpackPlugin(),
      toBeExtracted,
      toBeIgnored,
      new StyleExtHtmlWebpackPlugin('toBeExtracted.css')
    ];
    config.module = {
      loaders: [
        {
          test: /stylesheet1.css$/,
          loader: version.extractTextLoader(toBeExtracted, ['css-loader'])
        },
        {
          test: /stylesheet2.css$/,
          loader: version.extractTextLoader(toBeIgnored, ['css-loader'])
        }
      ]
    };
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    expected.not.html = [
      /<style>[\s\S]*colour: gray;[\s\S]*<\/style>/
    ];
    expected.files = [
      'toBeIgnored.css'
    ];
    expected.not.files = [
      'toBeExtracted.css'
    ];
    testPlugin(config, expected, done);
  });

  it('is happy when switched off for debug mode', done => {
    const config = baseConfig('one_stylesheet');
    config.plugins = [
      new HtmlWebpackPlugin(),
      new ExtractTextPlugin('styles.css'),
      new StyleExtHtmlWebpackPlugin(false)
    ];
    const expected = baseExpectations();
    expected.files = ['styles.css'];
    expected.not.files = [];
    expected.not.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('is happy if \'true\' is passed as the filename', done => {
    const config = baseConfig('one_stylesheet');
    config.plugins = [
      new HtmlWebpackPlugin(),
      new ExtractTextPlugin('styles.css'),
      new StyleExtHtmlWebpackPlugin(true)
    ];
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('copes with a public path', done => {
    const config = baseConfig('one_stylesheet');
    config.output.publicPath = '/wibble/';
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('copes with a public path with specified css file', done => {
    const config = baseConfig('one_stylesheet');
    config.output.publicPath = '/wibble/';
    config.plugins = [
      new HtmlWebpackPlugin(),
      new ExtractTextPlugin('styles.css'),
      new StyleExtHtmlWebpackPlugin('styles.css')
    ];
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('understands blank options object', done => {
    const config = baseConfig('one_stylesheet');
    config.plugins = [
      new HtmlWebpackPlugin(),
      new ExtractTextPlugin('styles.css'),
      new StyleExtHtmlWebpackPlugin({})
    ];
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('understands disabled in options object', done => {
    const config = baseConfig('one_stylesheet');
    config.plugins = [
      new HtmlWebpackPlugin(),
      new ExtractTextPlugin('styles.css'),
      new StyleExtHtmlWebpackPlugin({enabled: false})
    ];
    const expected = baseExpectations();
    expected.files = ['styles.css'];
    expected.not.files = [];
    expected.not.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('understands specified css file in options object', done => {
    const config = baseConfig('one_stylesheet');
    config.output.publicPath = '/wibble/';
    config.plugins = [
      new HtmlWebpackPlugin(),
      new ExtractTextPlugin('styles.css'),
      new StyleExtHtmlWebpackPlugin({file: 'styles.css'})
    ];
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('supports multiple entry points', done => {
    testMultiEntry(multiEntryConfig(), multiEntryExpectations(), done);
  });

  it('supports multiple entry points with public path', done => {
    const config = multiEntryConfig();
    config.output.publicPath = '/wibble/';
    testMultiEntry(multiEntryConfig(), multiEntryExpectations(), done);
  });
});
