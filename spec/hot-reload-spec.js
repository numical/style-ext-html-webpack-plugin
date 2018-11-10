/*
 * HOT RELOAD TESTS ARE ALL IN A PENDING STATE AS EXTRACT-TEXT-HTML-WEBPACK-PLUGIN
 * DOES NOT SUPPORT HOT RELOAD (aka 'HMR' or HOT MODULE REPLACEMENT) FUNCTIONALITY
*/

/* eslint-env jasmine */
'use strict';
const path = require('path');
const rimraf = require('rimraf');
const version = require('./helpers/versions');
const testPlugin = require('./helpers/hot-reload-test.js');
const baseExpectations = require('./expectations.js').base;

const OUTPUT_DIR = path.join(__dirname, '../dist');
const PENDING = 'ExtractTextWebpackPlugin does not yet support hot reload functionality - see https://github.com/webpack/extract-text-webpack-plugin/issues/30';

describe(`Hot reload functionality (webpack ${version.describe})`, () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  it('change referenced stylesheet in entry file', done => {
    const expectations = [];
    expectations[0] = baseExpectations();
    expectations[0].html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    expectations[1] = baseExpectations();
    expectations[1].html = [
      /<style>[\s\S]*background: black;[\s\S]*<\/style>/
    ];
    const testIterations = [
      {
        fileToChange: 'entry,js',
        fileContents: '\'use strict\';require(\'./stylesheet2.css\');require(\'./index.js\');'
      }
    ];
    testPlugin(expectations, testIterations, done);
  }).pend(PENDING);

  it('edit stylesheet referenced stylesheet by entry file', done => {
    const expectations = [];
    expectations[0] = baseExpectations();
    expectations[0].html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    expectations[1] = baseExpectations();
    expectations[1].html = [
      /<style>[\s\S]*background: yellow;[\s\S]*<\/style>/
    ];
    const testIterations = [
      {
        fileToChange: 'stylesheet1.css',
        fileContents: 'body { background: yellow; }'
      }
    ];
    testPlugin(expectations, testIterations, done);
  }).pend(PENDING);

  it('change referenced stylesheet twice', done => {
    const expectations = [];
    expectations[0] = baseExpectations();
    expectations[0].html = [
      /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
    ];
    expectations[1] = baseExpectations();
    expectations[1].html = [
      /<style>[\s\S]*background: yellow;[\s\S]*<\/style>/
    ];
    expectations[2] = baseExpectations();
    expectations[2].html = [
      /<style>[\s\S]*background: red;[\s\S]*<\/style>/
    ];
    const testIterations = [
      {
        fileToChange: 'stylesheet1.css',
        fileContents: 'body { background: yellow; }'
      },
      {
        fileToChange: 'stylesheet1.css',
        fileContents: 'body { background: red; }'
      }
    ];
    testPlugin(expectations, testIterations, done);
  }).pend(PENDING);
});
