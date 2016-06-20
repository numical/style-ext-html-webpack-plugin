/* eslint-env jasmine */
'use strict';

// const C = require('../constants.js');
const SHORT_CONTENT = 'abcd/*efg*/hijklmn/*opq*/rstuvwxyz';
const WRAPPED_SHORT_CONTENT = ' /* style-ext-html-webpack-plugin:start: abcdstyle-ext-html-webpack-plugin:commentstartefgstyle-ext-html-webpack-plugin:commentendhijklmnstyle-ext-html-webpack-plugin:commentstartopqstyle-ext-html-webpack-plugin:commentendrstuvwxyz :style-ext-html-webpack-plugin:end */ ';

const CONTENT = 'Lorem ipsum dolor sit amet, /*consectetur adipiscing elit*/, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut /*aliquip*/ ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu /*fugiat nulla pariatur.*/ Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum';
const WRAPPED_CONTENT = ' /* style-ext-html-webpack-plugin:start: Lorem ipsum dolor sit amet, style-ext-html-webpack-plugin:commentstartconsectetur adipiscing elitstyle-ext-html-webpack-plugin:commentend, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut style-ext-html-webpack-plugin:commentstartaliquipstyle-ext-html-webpack-plugin:commentend ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu style-ext-html-webpack-plugin:commentstartfugiat nulla pariatur.style-ext-html-webpack-plugin:commentend Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum :style-ext-html-webpack-plugin:end */ ';

const wrapper = require('../wrapper.js');

describe('Wrapper functionality: ', () => {
  it('wrap short content', () => {
    const result = wrapper.wrapContent(SHORT_CONTENT);
    expect(result).toEqual(WRAPPED_SHORT_CONTENT);
  });

  it('wrap long content', () => {
    const result = wrapper.wrapContent(CONTENT);
    expect(result).toEqual(WRAPPED_CONTENT);
  });

  it('extract single wrapped content', () => {
    const content = SHORT_CONTENT + wrapper.wrapContent(SHORT_CONTENT) + SHORT_CONTENT;
    const results = wrapper.extractWrappedContent(content);
    expect(results.length).toBe(1);
    expect(results[0].content).toEqual(SHORT_CONTENT);
  });

  it('extract multiple wrapped content', () => {
    const content = SHORT_CONTENT +
                    wrapper.wrapContent(SHORT_CONTENT) +
                    SHORT_CONTENT +
                    wrapper.wrapContent(SHORT_CONTENT) +
                    SHORT_CONTENT +
                    wrapper.wrapContent(SHORT_CONTENT);
    const results = wrapper.extractWrappedContent(content);
    expect(results.length).toBe(3);
    results.forEach((result) => {
      expect(result.content).toEqual(SHORT_CONTENT);
    });
  });
});
