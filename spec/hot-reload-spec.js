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

describe(`Hot reload functionality (${version.display})`, () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  version.testFn.hmr('change referenced stylesheet in entry file', done => {
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
  });

  version.testFn.hmr('edit stylesheet referenced stylesheet by entry file', done => {
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
  });

  version.testFn.hmr('change referenced stylesheet twice', done => {
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
  });
});
