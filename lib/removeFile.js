'use strict';

const debug = require('./common.js').debug;

const deleteFileFromCompilation = (compilation, filename) => {
  delete compilation.assets[filename];
  compilation.chunks.forEach(chunk => {
    const fileIndex = chunk.files.indexOf(filename);
    if (fileIndex > -1) {
      chunk.files.splice(fileIndex, 1);
    }
  });
  debug(`emit: asset '${filename}' deleted`);
};

module.exports = deleteFileFromCompilation;
