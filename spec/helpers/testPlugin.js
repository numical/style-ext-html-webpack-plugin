/* eslint-env jasmine */
/* global since:false */
'use strict';

const path = require('path');
const fs = require('fs');
const OUTPUT_DIR = path.join(__dirname, '../../dist');

function testPlugin (webpack, webpackConfig, expectedHtmlContent, expectedJsContent, done) {
  if (typeof expectedJsContent === 'function') {
    done = expectedJsContent;
    expectedJsContent = [];
  }
  webpack(webpackConfig, function (err, stats) {
    expect(err).toBeFalsy();
    const compilationErrors = (stats.compilation.errors || []).join('\n');
    expect(compilationErrors).toBe('');
    const compilationWarnings = (stats.compilation.warnings || []).join('\n');
    expect(compilationWarnings).toBe('');

    testFileContent(expectedHtmlContent, 'index.html', done);
    testFileContent(expectedJsContent, 'index_bundle.js', done);

    done();
  });
}

function testFileContent (expectedContent, file, done) {
  if (expectedContent.length > 0) {
    const content = getFileContent(file);
    if (content === null) {
      return done();
    }
    testContent(content, expectedContent, 'expect ' + file + ' contents to match ' + expectedContent);
  }
}

function getFileContent (file) {
  const fileExists = fs.existsSync(path.join(OUTPUT_DIR, file));
  since('file ' + file + ' should exist').expect(fileExists).toBe(true);
  return fileExists ? fs.readFileSync(path.join(OUTPUT_DIR, file)).toString() : null;
}

function testContent (content, expectedContents, msg) {
  expectedContents.forEach((expectedContent) => {
    if (expectedContent instanceof RegExp) {
      since(msg).expect(content).toMatch(expectedContent);
    } else {
      since(msg).expect(content).toContain(expectedContent);
    }
  });
}

module.exports = testPlugin;
