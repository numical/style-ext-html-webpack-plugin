/* eslint-env jasmine */
'use strict';

const rimraf = require('rimraf');
const path = require('path');
const version = require('./helpers/versions');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const testPlugin = require('./helpers/core-test.js');
const mainTests = require('./helpers/main-tests.js');
const expectations = require('./expectations.js');
const { baseConfig } = require('./helpers/configs.js');

const OUTPUT_DIR = path.join(__dirname, '../dist');

describe(`Core Functionality (${version.display})`, () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  mainTests({}, expectations.base, null, expectations.multiEntry);

  version.testFn.sharedEvent('plays happily with other plugins using same html plugin event', done => {
    const config = baseConfig();
    config.plugins.push(new ScriptExtHtmlWebpackPlugin({
      defaultAttribute: 'async'
    }));
    const expected = expectations.base();
    expected.html = [
      /<script (type="text\/javascript" )?src="index_bundle.js[?]?[\S]*" async><\/script>/,
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    testPlugin(config, expected, done);
  });
});
