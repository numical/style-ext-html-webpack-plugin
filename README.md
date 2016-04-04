Style Extension for HTML Webpack Plugin
========================================
Enhances [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin)
functionality by enabling inline styles. 

This is an extension plugin for the [webpack](http://webpack.github.io) plugin [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin) - a plugin that simplifies the creation of HTML files to serve your webpack bundles.

The raw [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin) can bundle CSS assets as `<link>` elements if used in conjunction with [extract-text-webpack-plugin](https://github.com/webpack/extract-text-webpack-plugin).  This extension plugin offers an alternative - inline `<style>` elements instead of `<link>` elements.

Installation
------------
Install the plugin with npm:
```shell
$ npm install --save-dev numical/style-ext-html-webpack-plugin
```

Basic Usage and Configuration
-----------------------------
The plugin has no configuration options.
However it must be set up as a plugin *and* as the final loader for the CSS assets you wish to be
inlined:

```javascript
module: {
  loaders: [
    { test: /\.css$/, loader: StyleExtHtmlWebpackPlugin.inline() }
  ]           
},
plugins: [
  new HtmlWebpackPlugin(),
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
  new HtmlWebpackPlugin(),
  new StyleExtHtmlWebpackPlugin()
]  
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
    { test: /stylesheet[2-9].css/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader') }
  ]
},
plugins: [
  new HtmlWebpackPlugin(),
  new StyleExtHtmlWebpackPlugin(),
  new ExtractTextPlugin('styles.css')
]
```

Example: to have stylesheet 1 inlined and stylesheets 2-9 combined and `<link>`'d in `styles.css`:
```javascript
module: {
  loaders: [
    { test: /stylesheet1.css/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader') },
    { test: /stylesheet[2-9].css/, loader: StyleExtHtmlWebpackPlugin.inline() }
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
Coming soon!

Alternative
-----------
Note that an alternative mechanism to inline CSS is possible, using the
[extract-text-plugin](https://github.com/webpack/extract-text-webpack-plugin) and templates - see
the [html-webpack-plugin
example](https://github.com/ampedandwired/html-webpack-plugin/tree/master/examples/inline).
