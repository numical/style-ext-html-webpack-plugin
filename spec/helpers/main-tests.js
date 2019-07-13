/* eslint-env jasmine */
'use strict';

const path = require('path');
const version = require('./versions');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('../../index.js');
const testPlugin = require('./core-test.js');
const testMultiEntry = require('./multi-entry-test.js');
const { baseConfig, multiEntryConfig } = require('./configs.js');

const mainTests = (defaultOptions, baseExpectations, yyy, multiEntryExpectations) => {
  it('inlines a single stylesheet', done => {
    const config = baseConfig(defaultOptions);
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('inlines a single stylesheet with quoted attributes and an import url', done => {
    const config = baseConfig('one_tricky_stylesheet', defaultOptions);
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*\u0040import url\(https:\/\/fonts.googleapis.com\/css\?family=Indie\+Flower[\s\S]*<\/style>/,
      /<style>[\s\S]*colour: grey;[\s\S]*<\/style>/,
      /<style>[\s\S]*\[contenteditable='true'][\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('inlines multiple stylesheets from a single source', done => {
    const config = baseConfig('two_stylesheets', defaultOptions);
    const expected = baseExpectations();
    expected.html = [
      // note British spelling
      /<style>[\s\S]*background: snow;[\s\S]*colour: grey;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('inlines multiple stylesheets from multiple sources', done => {
    const config = baseConfig('nested_stylesheets', defaultOptions);
    const expected = baseExpectations();
    expected.html = [
      // note British spelling
      /<style>[\s\S]*background: snow;[\s\S]*colour: grey;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('inlining works alongside webpack css loaders', done => {
    const config = baseConfig('two_stylesheets', defaultOptions);
    if (version.major < 4) {
      config.module.loaders = [
        {
          test: /stylesheet1.css/,
          loader: version.extractPlugin.loader(['css-loader'])
        },
        {
          test: /stylesheet2.css/,
          loader: 'style-loader!css-loader'
        }
      ];
    } else {
      config.module.rules = [
        {
          test: /stylesheet1.css/,
          use: version.extractPlugin.loader(['css-loader'])
        },
        {
          test: /stylesheet2.css/,
          use: [
            { loader: 'style-loader' },
            { loader: 'css-loader' }
          ]
        }
      ];
    }
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
    const config = baseConfig('one_stylesheet_with_web_font', defaultOptions);
    config.plugins.pop(); // removes StyleExt plugin
    if (version.major < 4) {
      config.module.loaders.push( // add file loader for local font file
        {
          test: /\.woff2$/,
          loader: 'file-loader?name=[name].[ext]'
        }
      );
    } else {
      config.module.rules.push(
        {
          test: /\.woff2$/,
          loader: 'file-loader',
          options: {
            name: '[name].[ext]'
          }
        }
      );
    }
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
    const config = baseConfig('one_stylesheet_with_web_font', defaultOptions);
    if (version.major < 4) {
      config.module.loaders.push( // add file loader for local font file
        {
          test: /\.woff2$/,
          loader: 'file-loader?name=[name].[ext]'
        }
      );
    } else {
      config.module.rules.push(
        {
          test: /\.woff2$/,
          loader: 'file-loader',
          options: {
            name: '[name].[ext]'
          }
        }
      );
    }
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*font-face[\s\S]*Indie-Flower[\s\S]*<\/style>/
    ];
    expected.files = [
      'Indie-Flower.woff2'
    ];
    testPlugin(config, expected, done);
  });

  version.testFn.templateStyles('works with html webpack plugin template styles', done => {
    const config = baseConfig(defaultOptions);
    // replace base HtmlWebpackPlugin
    config.plugins[0] = new HtmlWebpackPlugin({
      template: path.join(__dirname, '../fixtures/html_template_with_style.ejs')
    });
    const expected = baseExpectations();
    expected.html = [
      /<style[\s\S]*background: snow;[\s\S]*<\/style>/,
      /<style>div { background: blue }<\/style>/,
      /<div id=("|')template_content("|')>/
    ];
    expected.not.html = [];
    testPlugin(config, expected, done);
  });

  it('works with cssnano to minimize css', done => {
    const config = baseConfig({
      entry: 'two_stylesheets',
      cssLoaders: ['css-loader', 'postcss-loader']
    }, defaultOptions);
    const expected = baseExpectations();
    // note spaces and unnecessary symbols have been removed
    expected.html = [
      /<style>[\s\S]*body{background:snow}[\s\S]*<\/style>/,
      /<style>[\s\S]*body{color:grey}[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('inlining works with postcss-loader', done => {
    const config = baseConfig({
      entry: 'two_stylesheets',
      cssLoaders: ['css-loader', 'postcss-loader']
    }, defaultOptions);
    const expected = baseExpectations();
    expected.html = [
      // note British speeling converted to American spelling, also minimzed as this is also in postcss processing
      /<style>[\s\S]*body{background:snow}[\s\S]*<\/style>/,
      /<style>[\s\S]*body{color:grey}[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('vanilla ExtractText handles [name] and [id] in css filename', done => {
    const config = baseConfig({
      cssFilename: '[name][id].css'
    }, defaultOptions);
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
    const config = baseConfig({
      cssFilename: '[name][id].css'
    }, defaultOptions);
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
    // 'contenthash' now a webpack reserved term
    // see https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/763
    const contenthash = version.major < 4 ? 'contenthash' : 'md5:contenthash:hex:20';
    const config = baseConfig({
      cssFilename: `[${contenthash}].css`
    }, defaultOptions);
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  // Note: why on earth test this? For people who simply add StyleExt to an existing
  // configuration with ExtractTextWebpackPlugin already in it
  it('handles nested css filename', done => {
    const config = baseConfig({
      cssFilename: 'css/styles.css'
    }, defaultOptions);
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
    const toBeExtracted = version.extractPlugin.create('toBeExtracted.css');
    const toBeIgnored = version.extractPlugin.create('toBeIgnored.css');
    const config = baseConfig('two_stylesheets', defaultOptions);
    config.plugins = [
      new HtmlWebpackPlugin(),
      toBeExtracted,
      toBeIgnored,
      new StyleExtHtmlWebpackPlugin('toBeExtracted.css')
    ];
    if (version.major < 4) {
      config.module = {
        loaders: [
          {
            test: /stylesheet1.css$/,
            loader: version.extractPlugin.loader(['css-loader'], toBeExtracted)
          },
          {
            test: /stylesheet2.css$/,
            loader: version.extractPlugin.loader(['css-loader'], toBeIgnored)
          }
        ]
      };
    } else {
      config.module = {
        rules: [
          {
            test: /stylesheet1.css$/,
            use: version.extractPlugin.loader(['css-loader'], toBeExtracted)
          },
          {
            test: /stylesheet2.css$/,
            use: version.extractPlugin.loader(['css-loader'], toBeIgnored)
          }
        ]
      };
    }
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
    const config = baseConfig(defaultOptions);
    config.plugins = [
      new HtmlWebpackPlugin(),
      version.extractPlugin.create('styles.css'),
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
    const config = baseConfig(defaultOptions);
    config.plugins = [
      new HtmlWebpackPlugin(),
      version.extractPlugin.create('styles.css'),
      new StyleExtHtmlWebpackPlugin(true)
    ];
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('copes with a public path', done => {
    const config = baseConfig(defaultOptions);
    config.output.publicPath = '/wibble/';
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('copes with a URL public path', done => {
    const config = baseConfig(defaultOptions);
    config.output.publicPath = 'https://www.github.com/wibble/';
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('copes with a public path with specified css file', done => {
    const config = baseConfig(defaultOptions);
    config.output.publicPath = '/wibble/';
    config.plugins = [
      new HtmlWebpackPlugin(),
      version.extractPlugin.create('styles.css'),
      new StyleExtHtmlWebpackPlugin('styles.css')
    ];
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('copes with a URL public path with specified css file', done => {
    const config = baseConfig(defaultOptions);
    config.output.publicPath = 'https://www.github.com/wibble/';
    config.plugins = [
      new HtmlWebpackPlugin(),
      version.extractPlugin.create('styles.css'),
      new StyleExtHtmlWebpackPlugin('styles.css')
    ];
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('understands blank options object', done => {
    const config = baseConfig(defaultOptions);
    config.plugins = [
      new HtmlWebpackPlugin(),
      version.extractPlugin.create('styles.css'),
      new StyleExtHtmlWebpackPlugin({})
    ];
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('understands disabled in options object', done => {
    const config = baseConfig(defaultOptions);
    config.plugins = [
      new HtmlWebpackPlugin(),
      version.extractPlugin.create('styles.css'),
      new StyleExtHtmlWebpackPlugin({ enabled: false })
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
    const config = baseConfig(defaultOptions);
    config.output.publicPath = '/wibble/';
    config.plugins = [
      new HtmlWebpackPlugin(),
      version.extractPlugin.create('styles.css'),
      new StyleExtHtmlWebpackPlugin({ file: 'styles.css' })
    ];
    const expected = baseExpectations();
    expected.html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  version.testFn.multiEntry('supports multiple entry points', done => {
    testMultiEntry(multiEntryConfig(), multiEntryExpectations(), done);
  });

  version.testFn.multiEntry('supports multiple entry points with public path', done => {
    const config = multiEntryConfig();
    config.output.publicPath = '/wibble/';
    testMultiEntry(multiEntryConfig(), multiEntryExpectations(), done);
  });

  it('supports true minify option', done => {
    const config = baseConfig(defaultOptions);
    config.plugins = [
      new HtmlWebpackPlugin(),
      version.extractPlugin.create('styles.css'),
      new StyleExtHtmlWebpackPlugin({ minify: true })
    ];
    const expected = baseExpectations();
    expected.html = [
      /<style>body{background:snow}<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('supports empty object minify option', done => {
    const config = baseConfig(defaultOptions);
    config.plugins = [
      new HtmlWebpackPlugin(),
      version.extractPlugin.create('styles.css'),
      new StyleExtHtmlWebpackPlugin({ minify: {} })
    ];
    const expected = baseExpectations();
    expected.html = [
      /<style>body{background:snow}<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('minifies multiple stylesheets from multiple sources', done => {
    const config = baseConfig('nested_stylesheets', defaultOptions);
    config.plugins = [
      new HtmlWebpackPlugin(),
      version.extractPlugin.create('styles.css'),
      new StyleExtHtmlWebpackPlugin({ minify: true })
    ];
    const expected = baseExpectations();
    expected.html = [
      /<style>@import url\(https:\/\/fonts\.googleapis\.com\/css\?family=Indie\+Flower\);body{background:snow}body{colour:grey}\[contenteditable=true]:active,\[contenteditable=true]:focus{border:none}<\/style>/
    ];
    testPlugin(config, expected, done);
  });

  it('passes on minify options', done => {
    const config = baseConfig('nested_stylesheets', defaultOptions);
    config.plugins = [
      new HtmlWebpackPlugin(),
      version.extractPlugin.create('styles.css'),
      new StyleExtHtmlWebpackPlugin({ minify: { level: 2 } })
    ];
    const expected = baseExpectations();
    expected.html = [
      /<style>@import url\(https:\/\/fonts\.googleapis\.com\/css\?family=Indie\+Flower\);body{background:snow;colour:grey}\[contenteditable=true]:active,\[contenteditable=true]:focus{border:none}<\/style>/
    ];
    testPlugin(config, expected, done);
  });
};

module.exports = mainTests;
