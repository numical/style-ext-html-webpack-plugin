'use strict';

var setModuleVersion = require('dynavers')('dynavers.json');

function VersionContext (webpackVersion, extractTextVersion, extractTextArgs) {
  this.webpackVersion = webpackVersion;
  this.extractTextVersion = extractTextVersion;
  this.extractTextArgs = extractTextArgs;
}
VersionContext.prototype.set = function () {
  setModuleVersion('webpack', this.webpackVersion);
  setModuleVersion('extract-text-webpack-plugin', this.extractTextVersion);
};
VersionContext.prototype.extractTextLoader = function (ExtractTextPlugin) {
  return ExtractTextPlugin.extract.apply(null, this.extractTextArgs);
};

module.exports = VersionContext;
