'use strict';
/* eslint-env jasmine */

const fs = require('fs');
const path = require('path');
const version = require('./versions.js');
const createTestDirectory = require('fs-temp/promise').mkdir;
const copyDir = require('ncp');
const makePromise = require('denodeify');
const writeFile = makePromise(fs.writeFile);
const testCompilation = require('./compilation-test.js');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('../../index.js');
const debug = require('debug')('StyleExt:hot-reload');

const OUTPUT_DIR = path.join(__dirname, '../../dist');
const FIXTURES_DIR = path.join(__dirname, '../fixtures/hot-reload');

module.exports = (expectations, testIterations, done) => {
  createTestDirectory()
    .then(setup)
    .then((setupResults) => {
      return new Promise((resolve, reject) => {
        try {
          // constants for the tests - a mess of interdependencies between the functions
          // so references passed around in the 'metadata' envelope
          const metaData = {
            iterationCount: 0,
            watcher: null,
            v1StartupHack: null,
            testFn: null
          };
          const testDir = setupResults[0];
          const compiler = setupResults[1];
          const iterate = iterateFn.bind(null, testDir, testIterations, metaData, done);
          const test = (err, stats) => {
            testCompilation(err, stats, 'index.html', 'index_bundle.js', expectations.shift());
            iterate();
          };
          metaData.testFn = test;
          // see funcion's doc below
          addStartupIterations(expectations, testIterations);
          // main test loop - the 'iterate' function will cause the 'watch' event to fire again
          metaData.watcher = compiler.watch({}, test);
          // promise faff to keep the error chain
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    })
    .catch((err) => {
      done.fail(err);
    });
};

const setup = (testDir) => {
  return Promise.all([
    copyTestFixtures(testDir),
    createCompiler(testDir)
  ]);
};

const copyTestFixtures = (testDir) => {
  return new Promise((resolve, reject) => {
    copyDir(FIXTURES_DIR, testDir, (err) => {
      (err) ? reject(err) : resolve(testDir);
    });
  });
};

const createCompiler = (testDir) => {
  return new Promise((resolve, reject) => {
    try {
      const compiler = webpack(createConfig(testDir));
      resolve(compiler);
    } catch (err) {
      reject(err);
    }
  });
};

const createConfig = (testDir) => {
  return {
    entry: path.join(testDir, 'entry.js'),
    output: {
      path: OUTPUT_DIR,
      filename: 'index_bundle.js'
    },
    plugins: [
      // note: cacheing must be OFF
      new HtmlWebpackPlugin({ cache: false }),
      version.extractPlugin.create('styles.css'),
      new StyleExtHtmlWebpackPlugin()
    ],
    module: {
      loaders: [
        {
          test: /\.css$/,
          loader: version.extractPlugin.loader(['css-loader'])
        }
      ]
    }
  };
};

/*
 * Main loop logic for test-change-recompile-retest loop.
 * The main complication is the webpack v1 startup hack - see 'WTF' below'
 */
const iterateFn = (testDir, testIterations, metaData, done) => {
  // startup faff - see WTF below
  if (metaData.v1StartupHack) {
    clearTimeout(metaData.v1StartupHack);
    metaData.v1StartupHack = null;
    debug('v1 startup hack cleared');
  }
  metaData.iterationCount += 1;
  debug(`watch iteration ${metaData.iterationCount}, remaining iterations = ${testIterations.length}`);
  // close watcher and test?
  if (testIterations.length === 0) {
    debug(`closing watcher after ${metaData.iterationCount} iterations`);
    metaData.watcher.close(done);
  } else {
    const testIteration = testIterations.shift();
    if (testIteration.fileToChange) {
      // write a change that causes 'watch' event to fire again
      debug(`About to write to file ${testIteration.fileToChange}`);
      return writeFile(
        path.join(testDir, testIteration.fileToChange),
        testIteration.fileContents
      );
    } else {
      // more startup hack faff
      debug('no file to write but test iterations left');
      if (version.major === 1 && metaData.iterationCount === 1) {
        debug('adding v1 startup hack');
        metaData.v1StartupHack = addv1StartupHack(metaData);
      }
    }
  }
};

/*
 * Webpack v.2 always calls the 'watch' function's callback TWICE on startup.
 * Hence this function duplicates the first expectation.
 * However there is a gotcha with Webpack v.1 - see WTF below.
 */
const addStartupIterations = (expectations, testIterations) => {
  // expectations.unshift(expectations[0]);
  // testIterations.unshift({});
};

/* WTF!?
 * What/why 'addv1StartupHack'?
 * Webpack v.1 can call the 'watch' function's callback once OR twice on startup.
 * This non-determinism is sort-of hinted at in
 * https://github.com/webpack/docs/wiki/node.js-api.
 * This hack gives Webpack v1 the chance to call the callback a second time, but
 * if it does not, the hack simulates that second call.
 * Note that, to prevent too many calls, this setTimeout must be cleared in the
 * callback function itself.
 * Yuk, yuk, yuk.
 */
const addv1StartupHack = (testMetaData) => {
  const callback = () => {
    debug('v1 startup hack forcing test callback...');
    testMetaData.testFn();
  };
  return setTimeout(callback, jasmine.DEFAULT_TIMEOUT_INTERVAL / 2);
};
