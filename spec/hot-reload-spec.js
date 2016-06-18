/* eslint-env jasmine */
'use strict';

// Workaround for css-loader issue
// https://github.com/webpack/css-loader/issues/144
if (!global.Promise) {
  require('es6-promise').polyfill();
}

// for debugging
if (typeof v8debug === 'object') {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
  Error.stackTraceLimit = 100;
}

const debug = require('debug')('StyleExtHtmlWebpackPlugin:hot-reload-spec');
const path = require('path');
const fs = require('fs');
const multidepRequire = require('multidep')('spec/multidep.json');
const rimraf = require('rimraf');
const temp = require('fs-temp/promise');
const makePromise = require('denodeify');
const copyDir = require('ncp');
const readFile = makePromise(fs.readFile);
const writeFile = makePromise(fs.writeFile);
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('../index.js');

const OUTPUT_DIR = path.join(__dirname, '../dist');
const OUTPUT_HTML = path.join(OUTPUT_DIR, 'index.html');
const FIXTURES_DIR = path.join(__dirname, 'fixtures/hot-reload');

const EXPECTED_COMPILATION_FUDGE = {
  htmlContent: [/<style>[\s\S]*background: snow;[\s\S]*<\/style>/]
};

const appendWebpackVersion = (s, version) => s + ' (wepback v' + version + ')';

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
    new HtmlWebpackPlugin({cache: false}),
    new StyleExtHtmlWebpackPlugin()
  ]
});

const copyFiles = (fromDir, toDir) => {
  return new Promise((resolve, reject) => {
    copyDir(fromDir, toDir, (err) => {
      (err) ? reject(err) : resolve(toDir);
    });
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

const runTest = (webpack, expectedCompilations, done) => {
  // there are always two watch events on first compile
  // so add a dupliacte test
  expectedCompilations.unshift(EXPECTED_COMPILATION_FUDGE);
  temp.mkdir()
    .then((testDir) => {
      return copyFiles(FIXTURES_DIR, testDir);
    })
  .then((testDir) => {
    const compiler = webpack(createWebpackConfig(testDir));
    let eventCount = 0;
    const watcher = compiler.watch({}, (err, stats) => {
      debug('watch event ' + eventCount++);
      expect(err).toBeFalsy();
      checkCompilationResult(stats);
      readFile(OUTPUT_HTML)
        .then((data) => {
          const expectedCompilation = expectedCompilations.shift();
          checkFileContents(data.toString(), expectedCompilation.htmlContent);
          if (expectedCompilations.length === 0) {
            debug('closing watcher');
            watcher.close(done);
          } else if (expectedCompilation.nextChangeFile) {
            debug('About to write to file \'' + expectedCompilation.nextChangeFile + '\'');
            return writeFile(
                path.join(testDir, expectedCompilation.nextChangeFile),
                expectedCompilation.nextChangeFileContents);
          }
        })
      .catch((err) => {
        done.fail(err);
      });
    });
  })
  .catch((err) => {
    done.fail(err);
  });
};

describe('Hot reload functionality', () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  multidepRequire.forEachVersion('webpack', function (version, webpack) {
    it(appendWebpackVersion('change stylesheet in entry file', version), (done) => {
      const expectedCompilations = [
        {
          htmlContent: [/<style>[\s\S]*background: snow;[\s\S]*<\/style>/],
          nextChangeFile: 'entry.js',
          nextChangeFileContents: '\'use strict\';require(\'./stylesheet2.css\');require(\'./index.js\');'
        },
        {
          htmlContent: [/<style>[\s\S]*background: black;[\s\S]*<\/style>/]
        }
      ];
      runTest(webpack, expectedCompilations, done);
    });
/*
    it(appendWebpackVersion('change stylesheet in entry file and then back again', version), (done) => {
      const expectedCompilations = [
        {
          htmlContent: [/<style>[\s\S]*background: snow;[\s\S]*<\/style>/],
          nextChangeFile: 'entry.js',
          nextChangeFileContents: '\'use strict\';require(\'./stylesheet2.css\');require(\'./index.js\');'
        },
        {
          htmlContent: [/<style>[\s\S]*background: black;[\s\S]*<\/style>/],
          nextChangeFile: 'entry.js',
          nextChangeFileContents: '\'use strict\';require(\'./stylesheet1.css\');require(\'./index.js\');'
        },
        {
          htmlContent: [/<style>[\s\S]*background: snow;[\s\S]*<\/style>/]
        }
      ];
      runTest(webpack, expectedCompilations, done);
    });
*/
  });
});
