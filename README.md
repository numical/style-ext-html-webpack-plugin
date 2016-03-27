Inline Extension for HTML Webpack Plugin
========================================
Enhances [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin)
functionality by enabling inline styles. 

This is an extension plugin for the [webpack](http://webpack.github.io) plugin [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin) - a plugin that simplifies the creation of HTML files to serve your webpack bundles.

The raw [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin) can bundle CSS assets as `<link>` elements if used in conjunction with [extract-text-webpack-plugin](https://github.com/webpack/extract-text-webpack-plugin).  This extension plugin offers an alternative - inline `<style>` elements instead of `<link>` elements.

Installation
------------
Install the plugin with npm:
```shell
$ npm install --save-dev numical/inline-ext-html-webpack-plugin
```

Basic Usage and Configuration
-----------------------------
The plugin has no configuration options.
However it must be set up as a plugin *and* as the final loader for the CSS assets you wish to be
inlined:

```javascript
module: {
  loaders: [
    { test: /\.css$/, loader: InlineExtHtmlWebpackPlugin.inline() }
  ]           
},
plugins: [
  new HtmlWebpackPlugin(),
  new InlineExtHtmlWebpackPlugin()
]  
```

The inline loader can be the end of a chain of CSS loaders, though note that any prior loader must output pure CSS, not javascript.  This means that [css-loader](https://www.npmjs.com/package/css-loader) and [style-loader](https://www.npmjs.com/package/style-loader) cannot be used, though the very useful [post-css](https://www.npmjs.com/package/postcss-loader) loader can be:

```javascript
module: {
  loaders: [
    { test: /\.css$/, loader: InlineExtHtmlWebpackPlugin.inline('postcss-loader') }
  ]           
},
postcss: [
  require('autoprefixer')
],
plugins: [
  new HtmlWebpackPlugin(),
  new InlineExtHtmlWebpackPlugin()
]  
```

You may also wish to minify the in-lined CSS.

This will come in the next release, dependent on a pull request to [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin).
 
Alternative
-----------
Note that an alternative mechanism to inline CSS is possible, using the
[extract-text-plugin](https://github.com/webpack/extract-text-webpack-plugin) and templates - see
the [html-webpack-plugin
example](https://github.com/ampedandwired/html-webpack-plugin/tree/master/examples/inline).
