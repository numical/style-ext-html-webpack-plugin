/* eslint-env jasmine */
'use strict';

const subject = require('../lib/config.js');
const defaultOptions = subject.defaultOptions;

describe('Options', () => {
  it('default enablement is true', () => {
    expect(defaultOptions.enabled).toBe(true);
  });

  it('default position is plugin', () => {
    expect(defaultOptions.position).toEqual('plugin');
  });

  it('default minify is false', () => {
    expect(defaultOptions.minify).toBe(false);
  });

  it('returns default values when nothing passed in', () => {
    expect(subject()).toEqual(defaultOptions);
  });

  it('returns default values when undefined passed in', () => {
    expect(subject(undefined)).toEqual(defaultOptions);
  });

  it('returns disabled when false passed in', () => {
    const expected = Object.assign({}, defaultOptions, { enabled: false });
    expect(subject(false)).toEqual(expected);
  });

  it('returns default options when true passed in', () => {
    expect(subject(true)).toEqual(defaultOptions);
  });

  it('if minify is passed as true, options.minify is empty object', () => {
    const options = subject({ minify: true });
    expect(options.minify).toEqual({});
  });

  it('if minify is passed as object, options.minify is same object', () => {
    const minify = { foo: 'bar' };
    const options = subject({ minify });
    expect(options.minify).toEqual(minify);
  });
});
