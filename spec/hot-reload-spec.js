'use strict';
/* eslint-env jasmine */

// bump up timeout as tests with multiple compilations are slow
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

// for debugging
if (typeof v8debug === 'object') {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
  Error.stackTraceLimit = 100;
}

const path = require('path');
const fs = require('fs');
const setModuleVersion = require('dynavers')('dynavers.json');
const rimraf = require('rimraf');
const temp = require('fs-temp/promise');
const copyDir = require('ncp');
const makePromise = require('denodeify');
const readFile = makePromise(fs.readFile);
const writeFile = makePromise(fs.writeFile);
const StyleExtHtmlWebpackPlugin = require('../index.js');
const debug = require('debug')('StyleExtHtmlWebpackPlugin:hot-reload-spec');

const WEBPACK_VERSIONS = require('./helpers/webpackVersions.js');
const OUTPUT_DIR = path.join(__dirname, '../dist');
const OUTPUT_HTML = path.join(OUTPUT_DIR, 'index.html');
const FIXTURES_DIR = path.join(__dirname, 'fixtures/hot-reload');

const test = (version, testIterations, done) => {
  createTestDirectory()
    .then(setup.bind(null, version, testIterations, done))
    .then(run)
    .catch((err) => {
      done.fail(err);
    });
};

const createTestDirectory = temp.mkdir;

const setup = (version, testIterations, done, testDir) => {
  return Promise.all([
    createTestFiles(testDir),
    createCompiler(testDir),
    createTest(version, testDir, testIterations, done)
  ]);
};

const run = (setupResults) => {
  return new Promise((resolve, reject) => {
    try {
      const compiler = setupResults[1];
      const testMetaData = setupResults[2];
      testMetaData.watcher = compiler.watch({}, testMetaData.callbackFn);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const createTestFiles = (testDir) => {
  return new Promise((resolve, reject) => {
    copyDir(FIXTURES_DIR, testDir, (err) => {
      (err) ? reject(err) : resolve(testDir);
    });
  });
};

const createCompiler = (testDir) => {
  const webpack = require('webpack');
  return new Promise((resolve, reject) => {
    try {
      const compiler = webpack(createWebpackConfig(testDir));
      resolve(compiler);
    } catch (err) {
      reject(err);
    }
  });
};

const createWebpackConfig = (testDir) => {
  const HtmlWebpackPlugin = require('html-webpack-plugin');
  return {
    entry: path.join(testDir, 'entry.js'),
    output: {
      path: OUTPUT_DIR,
      filename: 'index_bundle.js'
    },
    module: {
      loaders: [
      {test: /\.css$/, loader: StyleExtHtmlWebpackPlugin.inline()}
      ]
    },
    plugins: [
      // note: cacheing must be OFF
      new HtmlWebpackPlugin({cache: false}),
      new StyleExtHtmlWebpackPlugin()
    ]
  };
};

// creates the callback function called every time webpack recompiles
// this callback is the core functionality of this test suite
// it uses the 'testIterations' to check the compiled HTML
// and to fire off the next file change and resultant recompilation
const createTest = (version, testDir, testIterations, done) => {
  const meta = {
    iterationCount: 0,
    callbackFn: null,
    watcher: null,
    v1StartupHack: null
  };
  const callbackFn = (err, stats) => {
    if (meta.v1StartupHack) {
      clearTimeout(meta.v1StartupHack);
      meta.v1StartupHack = null;
      debug('v1 startup hack cleared');
    }
    debug('watch iteration ' + meta.iterationCount + ', remaining iterations = ' + testIterations.length);
    expect(err).toBeFalsy();
    if (stats) checkCompilationResult(stats);
    readFile(OUTPUT_HTML)
      .then((data) => {
        meta.iterationCount++;
        const testIteration = testIterations.shift();
        checkFileContents(data.toString(), testIteration.expectedHtmlContent);
        if (testIterations.length === 0) {
          debug('closing watcher after ' + meta.iterationCount + ' iterations');
          meta.watcher.close(done);
        } else if (testIteration.nextFileToChange) {
          debug('About to write to file \'' + testIteration.nextFileToChange + '\'');
          return writeFile(
              path.join(testDir, testIteration.nextFileToChange),
              testIteration.nextFileToChangeContents);
        } else {
          debug('no file to write but test iterations left');
          if (version.startsWith('1') && meta.iterationCount === 1) {
            debug('adding v1 startup hack');
            meta.v1StartupHack = addv1StartupHack(meta);
          }
        }
      })
      .catch((err) => {
        done.fail(err);
      });
  };
  meta.callbackFn = callbackFn;
  addStartupIterations(testIterations);
  return Promise.resolve(meta);
};

const addStartupIterations = (testIterations) => {
  testIterations.unshift({
    expectedHtmlContent: [/<style>[\s\S]*background: snow;[\s\S]*<\/style>/]
  });
};

const checkCompilationResult = (stats) => {
  const compilationErrors = (stats.compilation.errors || []).join('\n');
  expect(compilationErrors).toBe('');
  const compilationWarnings = (stats.compilation.warnings || []).join('\n');
  expect(compilationWarnings).toBe('');
};

const checkFileContents = (content, expectedContents) => {
  expectedContents.forEach((expectedContent) => {
    if (expectedContent instanceof RegExp) {
      expect(content).toMatch(expectedContent);
    } else {
      expect(content).toContain(expectedContent);
    }
  });
};

/* WTF!?
 * What/why 'addv1StartupHack'?
 * Webpack v.2 always calls the 'watch' function's callback TWICE on startup.
 * This is the point of the 'addStartupIterations' function in this Spec.
 * Webpack v.1 sometimes also does this, but unfortunately can also only call
 * the callback ONCE on startup. (This non-determinism is sort-of hinted at in
 * https://github.com/webpack/docs/wiki/node.js-api).
 * This hack gives Webpack v1 the chance to call the callback a second time, but
 * if it does not, the hack simulates that second call.
 * Note that, to prevent too many calls, this setTimeout must be cleared in the
 * callback function itself.
 * Yuk, yuk, yuk.
 */
const addv1StartupHack = (testMetaData) => {
  const callback = () => {
    debug('v1 startup hack forcing test callback...');
    testMetaData.callbackFn();
  };
  return setTimeout(callback, jasmine.DEFAULT_TIMEOUT_INTERVAL / 2);
};

describe('Hot reload functionality: ', () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  WEBPACK_VERSIONS.forEach(webpackVersion => {
    setModuleVersion('webpack', webpackVersion, true);

    describe('Webpack v' + webpackVersion + ':', () => {
      it('change referenced stylesheet in entry file', (done) => {
        const testIterations = [
          {
            expectedHtmlContent: [/<style>[\s\S]*background: snow;[\s\S]*<\/style>/],
            nextFileToChange: 'entry.js',
            nextFileToChangeContents: '\'use strict\';require(\'./stylesheet2.css\');require(\'./index.js\');'
          },
          {
            expectedHtmlContent: [/<style>[\s\S]*background: black;[\s\S]*<\/style>/]
          }
        ];
        debug('change referenced stylesheet in entry file');
        test(webpackVersion, testIterations, done);
      });

      it('edit stylesheet referenced by entry file', (done) => {
        const testIterations = [
          {
            expectedHtmlContent: [/<style>[\s\S]*background: snow;[\s\S]*<\/style>/],
            nextFileToChange: 'stylesheet1.css',
            nextFileToChangeContents: 'body { background: yellow; }'
          },
          {
            expectedHtmlContent: [/<style>[\s\S]*background: yellow;[\s\S]*<\/style>/]
          }
        ];
        debug('edit stylesheet referenced by entry file');
        test(webpackVersion, testIterations, done);
      });

      it('change stylesheet referenced by entry file and then back again', (done) => {
        const testIterations = [
          {
            expectedHtmlContent: [/<style>[\s\S]*background: snow;[\s\S]*<\/style>/],
            nextFileToChange: 'entry.js',
            nextFileToChangeContents: '\'use strict\';require(\'./stylesheet2.css\');require(\'./index.js\');'
          },
          {
            expectedHtmlContent: [/<style>[\s\S]*background: black;[\s\S]*<\/style>/],
            nextFileToChange: 'entry.js',
            nextFileToChangeContents: '\'use strict\';require(\'./stylesheet1.css\');require(\'./index.js\');'
          },
          {
            expectedHtmlContent: [/<style>[\s\S]*background: snow;[\s\S]*<\/style>/]
          }
        ];
        debug('change stylesheet referenced by entry file and then back again');
        test(webpackVersion, testIterations, done);
      });
    });
  });
});
