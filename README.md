========================================
[![npm version](https://badge.fury.io/js/style-ext-html-webpack-plugin.svg)](http://badge.fury.io/js/style-ext-html-webpack-plugin) [![Dependency Status](https://david-dm.org/numical/style-ext-html-webpack-plugin.svg)](https://david-dm.org/numical/style-ext-html-webpack-plugin) [![Build status](https://travis-ci.org/numical/style-ext-html-webpack-plugin.svg)](https://travis-ci.org/numical/style-ext-html-webpack-plugin) [![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

[![NPM](https://nodei.co/npm/style-ext-html-webpack-plugin.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/style-ext-html-webpack-plugin/)


Enhances [HtmlWebpackPlugin](https://github.com/ampedandwired/html-webpack-plugin)
functionality by enabling inline styles. 

This is an extension plugin for the [Webpack](http://webpack.github.io) plugin [HtmlWebpackPlugin](https://github.com/ampedandwired/html-webpack-plugin) - a plugin that simplifies the creation of HTML files to serve your webpack bundles.

The raw [HtmlWebpackPlugin](https://github.com/ampedandwired/html-webpack-plugin) can bundle CSS assets as `<link>` elements if used in conjunction with [ExtractTextPlugin](https://github.com/webpack/extract-text-webpack-plugin).  This extension plugin offers an alternative - inline `<style>` elements instead of `<link>` elements.

Note: this is for inlining `<style>`'s only - if you wish to inline `<scripts>`'s please take a look at:
- the [HtmlWebpackPlugin inline example](https://github.com/ampedandwired/html-webpack-plugin/tree/master/examples/inline) based on jade templates;
- the experimental inlining feature of sister plugin
[script-ext-html-webpack-plugin](https://github.com/numical/script-ext-html-webpack-plugin).

Installation
------------
You must be running webpack v1.x or v2.x on node v4,5,6+.

Install the plugin with npm:
```shell
$ npm install --save-dev style-ext-html-webpack-plugin
```

Basic Usage
-----------
The plugin must be added to the webpack config as both a plugin *and* as the loader for the CSS assets you wish to be inlined:

```javascript
module: {
  loaders: [
    { test: /\.css$/, loader: StyleExtHtmlWebpackPlugin.inline() }
  ]           
},
plugins: [
  new HtmlWebpackPlugin(
    ...
    cache: false
  ),
  new StyleExtHtmlWebpackPlugin()
]  
```

The inline loader can be the end of a chain of CSS loaders, though note that any prior loader must output pure CSS, not javascript.  This means that [css-loader](https://www.npmjs.com/package/css-loader) and [style-loader](https://www.npmjs.com/package/style-loader) cannot be used, though the very useful [post-css](https://www.npmjs.com/package/postcss-loader) loader can be:

```javascript
module: {
  loaders: [
    { test: /\.css$/, loader: StyleExtHtmlWebpackPlugin.inline('postcss-loader') }
  ]           
},
postcss: [
  require('autoprefixer')
],
plugins: [
  new HtmlWebpackPlugin({
    ...
    cache: false
  }),
  new StyleExtHtmlWebpackPlugin()
]  
```


Hot Module Replacement
----------------------
If you wish to allow for hot module replacements either directly via webpack [`watch`](http://webpack.github.io/docs/tutorials/getting-started/#watch-mode) options or indirectly using [`webpack-dev-server`](http://webpack.github.io/docs/tutorials/getting-started/#development-server) then there are two further configuration constraints:
1. `HtmlWebpackPlugin` must have its cache switched off;
2. any Webpack [`devtool`](https://webpack.github.io/docs/configuration.html#devtool) settings must not include any `eval` option:
```javascript
plugins: [
  new HtmlWebpackPlugin({
    ...
    cache: false
  }),
  new StyleExtHtmlWebpackPlugin()
],
devtool: 'cheap-source-map' // fine but 'eval-source-map' would not be
```


Using with Non-Inlined CSS
--------------------------
You may wish to have only some of your CSS inlined.

This can be achieved by using this plugin alongside webpack's conventional [CSS](https://www.npmjs.com/package/css-loader) [loaders](https://www.npmjs.com/package/style-loader) and/or the
[ExtractTextPlugin](https://github.com/webpack/extract-text-webpack-plugin).  The trick is to define multiple, distinct CSS loader paths in webpack's configuration:

Example: to have stylesheet 1 inlined and stylesheets 2-9 loaded via javascript:
```javascript
module: {
  loaders: [
    { test: /stylesheet1.css/, loader: StyleExtHtmlWebpackPlugin.inline() },
    { test: /stylesheet[2-9].css/, loader: 'style!css' }
  ]
},
plugins: [
  new HtmlWebpackPlugin(),
  new StyleExtHtmlWebpackPlugin()
]
```

Example: to have stylesheet 1 inlined and stylesheets 2-9 combined and `<link>`'d in `styles.css`:
```javascript
module: {
  loaders: [
    { test: /stylesheet1.css/, loader: StyleExtHtmlWebpackPlugin.inline() },
    { test: /stylesheet[2-9].css/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader') }
  ]
},
plugins: [
  new HtmlWebpackPlugin(),
  new StyleExtHtmlWebpackPlugin(),
  new ExtractTextPlugin('styles.css')
]
```
Of course, more sophisticated `RegEx`'s offer more selectivity. Make sure `test` patterns do not overlap else you will end up with CSS in multiple places.

Minification
------------
The plugin can be configured to use [clean-css](https://github.com/jakubpawlowicz/clean-css) to minify the inlined CSS.

Note that clean-css is an optional dependency so to use it you must explicitly install it:
```shell
$ npm install clean-css
```
If you forget this you will recieve error:
`Cannot find module 'clean-css'`

Clean-css is enabled by passing the StyleExtHtmlWebpackPlugin constructor a hash with a single property:
- `minify`: `true` or, to customise css-clean behaviour, another hash with properties defined in the [clean-css
docs](https://github.com/jakubpawlowicz/clean-css#how-to-use-clean-css-api).

Example: default minification
```javascript
plugins: [
  new HtmlWebpackPlugin(),
  new StyleExtHtmlWebpackPlugin({
    minify: true
  })
]
``` 
Example: customised minification
```javascript
plugins: [
  new HtmlWebpackPlugin(),
  new StyleExtHtmlWebpackPlugin({
    minify: {
      keepSpecialComments: *,
      roundingPrecision: -1
    }
  })
]
```

Performance
-----------
v2.x of this plugin brought Webpack 2.x compatibility but at the price of potentially slower performance.
Moreover, for hot module replacement, this plugin also requires that `HtmlWebpackPlugin`'s cache is switched off.
If you consider performance unacceptable please [raise an
issue](https://github.com/numical/style-ext-html-webpack-plugin/issues) giving your configuration.



Debugging
---------
If you have problems and want to sort them out yourself(!), this plugin has built-in debugging that
may help.  It uses the [debug](https://github.com/visionmedia/debug) utility.  Available debug names:
* `StyleExtHtmlWebpackPlugin:plugin` for the plugin;
* `StyleExtHtmlWebpackPlugin:loader` for the loader;
* `StyleExtHtmlWebpackPlugin:detail` for core values (note __verbose__!);
* `StyleExtHtmlWebpackPlugin:hot-reload-spec` for instrumenting the hot reload tests;
* or, for all of them: `StyleExtHtmlWebpackPlugin:*`


Change History
--------------

* v2.0.5 - modified test to use dynavers with webpack 1.13.2 and 2.1.0-beta.16
* v2.0.4 - fixed jasmine dependency to explicit version v2.4.1 due to [bug](https://github.com/jasmine/jasmine-npm/issues/90) in v2.5
* v2.0.3 - updated dependency versions, reclassified some dependencies
* v2.0.2 - merged pull request by 7pass fixing 2.0.1 - thanks!
* v2.0.1 - added explicit guard against use of `devtool eval` option
* v2.0.0 - webpack 1.x and 2.x compatible, including hot reloading
* v2.0.0.beta.3 - warnings about beta testing (!), debug enhancements, and better unescaping
* v2.0.0.beta.2 - Travis timeout and tag spacing fixes
* v2.0.0-beta.1 - node 4.x fix and fixed handling of multiple scripts
* v2.0.0-beta.0 - hot module reload working (with `HtmlWepbackPlugin` cache switched off)
* v1.1.1 - hot module reload not working with webpack 2
* v1.1.0 - now Webpack 2.x compatible
* v1.0.7 - added warning that not compatible with Webpack 2
* v1.0.6 - updated tests to match changes in
[script-ext-html-webpack-plugin](https://github.com/numical/script-ext-html-webpack-plugin)
* v1.0.5 - updated code to match changes in [semistandard](https://github.com/Flet/semistandard)
* v1.0.4 - added debug options
* v1.0.3 - documentation update
* v1.0.2 - documentation update
* v1.0.1 - now plays happily with plugins on same event
* v1.0.0 - initial release



Alternative
-----------
Note that an alternative mechanism to inline CSS is possible, using the
[ExtractTextPlugin](https://github.com/webpack/extract-text-webpack-plugin) and templates - see the [HtmlWebpackPlugin example](https://github.com/ampedandwired/html-webpack-plugin/tree/master/examples/inline).
