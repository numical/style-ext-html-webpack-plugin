/* eslint-env jasmine */
'use strict';

const compilationTest = require('./compilation-test.js');

module.exports = (config, entries, done) => {
  const webpack = require('webpack');
  webpack(config, (err, stats) => {
    entries.forEach(entry => {
      const { htmlFile, jsFile, expected } = entry;
      compilationTest(err, stats, htmlFile, jsFile, expected);
    });
    done();
  });
};
