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
}

const path = require('path');
const fs = require('fs');
const multidepRequire = require('multidep')('spec/multidep.json');
const rimraf = require('rimraf');
const temp = require('fs-temp/promise');
const makePromise = require('denodeify');
const copyFiles = makePromise(require('ncp'));
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('../index.js');

const OUTPUT_DIR = path.join(__dirname, '../dist');

const appendVersion = (s, version) => s + ' (wepback v' + version + ')';

const createConfig = (baseDir) => ({
  entry: path.join(baseDir, 'one_stylesheet.js'),
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
    new HtmlWebpackPlugin(),
    new StyleExtHtmlWebpackPlugin()
  ]
});

const startWatching = (compiler) => {
  return new Promise((resolve, reject) => {
    try {
      compiler.watch({}, (err, stats) => {
        if (err) return reject(err);
        resolve(stats);
      });
    } catch (err) {
      reject(err);
    }
  });
};

const checkCompilationResult = (stats, expectedHtml) => {
  return new Promise((resolve, reject) => {
    try {
      const compilationErrors = (stats.compilation.errors || []).join('\n');
      expect(compilationErrors).toBe('');
      const compilationWarnings = (stats.compilation.warnings || []).join('\n');
      expect(compilationWarnings).toBe('');
      const htmlFile = path.join(OUTPUT_DIR, 'index.html');
      fs.readFile(htmlFile, (err, data) => {
        if (err) return reject(err);
        testFileContents(data.toString(), expectedHtml);
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
};

const testFileContents = (content, expectedContents) => {
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
    rimraf(OUTPUT_DIR, done);
  });

  multidepRequire.forEachVersion('webpack', function (version, webpack) {
    it(appendVersion('test', version), (done) => {
      let testDir = null;
      temp.mkdir()
      .then((dir) => {
        testDir = dir;
        const fixturesDir = path.join(__dirname, 'fixtures');
        return copyFiles(fixturesDir, testDir);
      })
      .then(() => {
        const compiler = webpack(createConfig(testDir));
        return startWatching(compiler);
      })
      .then((stats) => {
        return checkCompilationResult(
            stats,
            [/<style>[\s\S]*background: snow;[\s\S]*<\/style>/]
        );
      })
      .then(() => {
        done();
      })
      .catch((err) => {
        done.fail(err);
      });
    });
  });
});

