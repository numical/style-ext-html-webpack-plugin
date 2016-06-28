'use strict';
/* eslint-env jasmine */

// Workaround for css-loader issue
// https://github.com/webpack/css-loader/issues/144
if (!global.Promise) {
  require('es6-promise').polyfill();
}

// bump up timeout as tests with multiple compilations are slow
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

// for debugging
if (typeof v8debug === 'object') {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
  Error.stackTraceLimit = 100;
}

const path = require('path');
const fs = require('fs');
const multidepRequire = require('multidep')('spec/multidep.json');
const rimraf = require('rimraf');
const temp = require('fs-temp/promise');
const copyDir = require('ncp');
const makePromise = require('denodeify');
const readFile = makePromise(fs.readFile);
const writeFile = makePromise(fs.writeFile);
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('../index.js');
const debug = require('debug')('StyleExtHtmlWebpackPlugin:hot-reload-spec');

const OUTPUT_DIR = path.join(__dirname, '../dist');
const OUTPUT_HTML = path.join(OUTPUT_DIR, 'index.html');
const FIXTURES_DIR = path.join(__dirname, 'fixtures/hot-reload');

const appendWebpackVersion = (s, version) => s + ' (wepback v' + version + ')';

const test = (webpack, testIterations, done) => {
  createTestDirectory()
    .then(setup.bind(null, webpack, testIterations, done))
    .then(run)
    .catch((err) => {
      done.fail(err);
    });
};

const createTestDirectory = temp.mkdir;

const setup = (webpack, testIterations, done, testDir) => {
  return Promise.all([
    createTestFiles(testDir),
    createCompiler(testDir, webpack),
    createTestCallback(testDir, testIterations, done)
  ]);
};

const run = (setupResults) => {
  return new Promise((resolve, reject) => {
    try {
      const compiler = setupResults[1];
      const testCallback = setupResults[2];
      testCallback.watcher = compiler.watch({}, testCallback);
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

const createCompiler = (testDir, webpack) => {
  return new Promise((resolve, reject) => {
    try {
      const compiler = webpack(createWebpackConfig(testDir));
      resolve(compiler);
    } catch (err) {
      reject(err);
    }
  });
};

const createWebpackConfig = (testDir) => ({
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
});

// creates the callback function called every time webpack recompiles
// this callback is the core functionality of this test suite
// it uses the 'testIterations' to check the compiled HTML
// and to fire off the next file change and resultant recompilation
const createTestCallback = (testDir, testIterations, done) => {
  addStartupIterations(testIterations);
  let eventCount = 0;
  const callbackFn = (err, stats) => {
    debug('watch event ' + eventCount++ + ', remaining iterations = ' + testIterations.length);
    expect(err).toBeFalsy();
    checkCompilationResult(stats);
    readFile(OUTPUT_HTML)
      .then((data) => {
        const testIteration = testIterations.shift();
        checkFileContents(data.toString(), testIteration.expectedHtmlContent);
        if (testIterations.length === 0) {
          debug('closing watcher after ' + eventCount + ' iterations');
          callbackFn.watcher.close(done);
        } else if (testIteration.nextFileToChange) {
          debug('About to write to file \'' + testIteration.nextFileToChange + '\'');
          return writeFile(
              path.join(testDir, testIteration.nextFileToChange),
              testIteration.nextFileToChangeContents);
        }
      })
      .catch((err) => {
        done.fail(err);
      });
  };
  return Promise.resolve(callbackFn);
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

// TODO - this is necessary to prevent Jasmine async timeouts, but why?
const pauseThen = (version, callback) => {
  if (version.startsWith('1.')) {
    setTimeout(callback, 10);
  } else {
    callback();
  }
};

describe('Hot reload functionality: ', () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  multidepRequire.forEachVersion('webpack', function (version, webpack) {
    it(appendWebpackVersion('change referenced stylesheet in entry file', version), (done) => {
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
      debug(appendWebpackVersion('change referenced stylesheet in entry file', version));
      test(webpack, testIterations, done);
    });

    it(appendWebpackVersion('edit stylesheet referenced by entry file', version), (done) => {
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
      pauseThen(version, () => {
        debug(appendWebpackVersion('edit stylesheet referenced by entry file', version));
        test(webpack, testIterations, done);
      });
    });

    it(appendWebpackVersion('change stylesheet referenced by entry file and then back again', version), (done) => {
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
      pauseThen(version, () => {
        debug(appendWebpackVersion('change stylesheet referenced by entry file and then back again', version));
        test(webpack, testIterations, done);
      });
    });
  });
});
