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
const copyFiles = makePromise(require('ncp'));
const writeToFile = makePromise(fs.writeFile);
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('../index.js');

const fixedFilePaths = {
  fixturesDir: path.join(__dirname, 'fixtures/hot-reload'),
  outputDir: path.join(__dirname, '../dist'),
  outputHtml: path.join(__dirname, '../dist', 'index.html'),
  outputJs: 'index_bundle.js'
};

const createTestFilePaths = (testDir) => ({
  testDir: testDir,
  entryFile: path.join(testDir, 'entry.js')
});

const appendVersion = (s, version) => s + ' (wepback v' + version + ')';

const createWebpackConfig = (testFilePaths) => ({
  entry: testFilePaths.entryFile,
  output: {
    path: fixedFilePaths.outputDir,
    filename: fixedFilePaths.outputJs
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

const createWatching = () => ({
  eventCount: 0,
  checkCompilation: false
});

const createWatchConfig = () => ({
  aggregateTimeout: 300
});

const startWatching = (compiler, expectedHtmlContent, done) => {
  return new Promise((resolve, reject) => {
    try {
      debug('starting watching');
      const watching = createWatching();
      const watcher = compiler.watch(createWatchConfig(), (err, stats) => {
        debug('watch event ' + watching.eventCount++);
        if (err) return reject(err);
        if (watching.checkCompilation) {
          debug('checking compilation for watch event ' + watching.eventCount);
          checkCompilationResult(stats);
          fs.readFile(fixedFilePaths.outputHtml, (err, data) => {
            try {
              if (err) return reject(err);
              checkFileContents(data.toString(), expectedHtmlContent.shift());
              resolve();
            } finally {
              if (expectedHtmlContent.length === 0) {
                debug('closing watcher');
                watcher.close(done);
              }
            }
          });
        } else {
          resolve(watching);
        }
      });
    } catch (err) {
      reject(err);
    }
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

describe('Hot reload functionality', () => {
  beforeEach((done) => {
    rimraf(fixedFilePaths.outputDir, done);
  });

  multidepRequire.forEachVersion('webpack', function (version, webpack) {
    it(appendVersion('test', version), (done) => {
      const expectedHtmlContent = [
        [/<style>[\s\S]*background: black;[\s\S]*<\/style>/]
        // [/<style>[\s\S]*background: snow;[\s\S]*<\/style>/]
      ];
      let testFilePaths;
      temp.mkdir()
      .then((testDir) => {
        testFilePaths = createTestFilePaths(testDir);
        return copyFiles(fixedFilePaths.fixturesDir, testFilePaths.testDir);
      })
      .then(() => {
        const compiler = webpack(createWebpackConfig(testFilePaths));
        return startWatching(compiler, expectedHtmlContent, done);
      })
      .then((watching) => {
        debug('About to change file \'' + testFilePaths.entryFile + '\'');
        watching.checkCompilation = true;
        return writeToFile(
          testFilePaths.entryFile,
          '\'use strict\';require(\'./stylesheet2.css\');require(\'./index.js\');'
        );
      })
      /*
      .then(() => {
        debug('About to change file \'' + testFilePaths.entryFile + '\'');
        return writeToFile(
          testFilePaths.entryFile,
          '\'use strict\';require(\'./stylesheet1.css\');require(\'./index.js\');'
        );
      })
      */
      .catch((err) => {
        done.fail(err);
      });
    });
  });
});

