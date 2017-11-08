'use strict';

const base = () => {
  return {
    html: [],
    js: [],
    files: [],
    not: {
      html: ['<link'],
      js: [],
      files: ['styles.css']
    }
  };
};

const multiEntry = () => {
  const expected1 = base();
  expected1.html = [
    /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
  ];
  expected1.not.html = [
    '<link',
    /<style>[\s\S]*\u0040import url\(https:\/\/fonts.googleapis.com\/css\?family=Indie\+Flower[\s\S]*<\/style>/,
    /<style>[\s\S]*colour: grey;[\s\S]*<\/style>/,
    /<style>[\s\S]*\[contenteditable='true'][\s\S]*<\/style>/
  ];
  const expected2 = base();
  expected2.html = [
    /<style>[\s\S]*\u0040import url\(https:\/\/fonts.googleapis.com\/css\?family=Indie\+Flower[\s\S]*<\/style>/,
    /<style>[\s\S]*colour: grey;[\s\S]*<\/style>/,
    /<style>[\s\S]*\[contenteditable='true'][\s\S]*<\/style>/
  ];
  expected2.not.html = [
    '<link',
    /<style>[\s\S]*background: snow;[\s\S]*<\/style>/
  ];
  const entries = [
    {
      htmlFile: 'page1.html',
      expected: expected1
    },
    {
      htmlFile: 'page2.html',
      expected: expected2
    }
  ];
  return entries;
};

module.exports = {
  base,
  multiEntry
};
